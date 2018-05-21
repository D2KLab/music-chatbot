/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
            
This is the DOREMUS Bot! Built with Botkit, using the Dialogflow middleware.

Authors:
  - Luca LOMBARDO   <lombardo@eurecom.fr>
  - Claudio SCALZO  <scalzo@eurecom.fr>
  
Supported platforms:
  - Slack
  - Facebook Messenger

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

// LOAD THE NECESSARY ENVIRONMENT VARIABLES IN THE .env FILE
require('dotenv').load();

// VARIABLES DECLARATION
var Botkit = require('botkit');
var request = require('request');
var http = require('http');
var nspell = require('nspell')
const fs = require('fs');

var enDIC = fs.readFileSync("./node_modules/dictionary-en-us/index.dic", 'utf-8')
var enAFF = fs.readFileSync("./node_modules/dictionary-en-us/index.aff", 'utf-8')
var spellEN = nspell(enAFF, enDIC)

var frDIC = fs.readFileSync("./node_modules/dictionary-fr/index.dic", 'utf-8')
var frAFF = fs.readFileSync("./node_modules/dictionary-fr/index.aff", 'utf-8')
var spellFR = nspell(frAFF, frDIC)

var speller = spellEN
var currentLang = "en"
var showNewSentence = false

// CHECKS FOR THE SLACK AND DIALOGFLOW TOKENS
if (!process.env.slackToken) {
    console.log('Error! Specify Slack token in environment');
    process.exit(1);
}

if (!process.env.dialogflow) {
    console.log('Error! Specify Dialogflow token in environment');
    process.exit(1);
}

if (!process.env.fbAccessToken || !process.env.fbVerifyToken || !process.env.fbAppSecret) {
  console.log('Error! Specify Facebook tokens in environment');
  process.exit(1);
}

// FUNCTION TO PERFORM THE SPELL CHECK
var performMisspellingCheck = function(message) {

  // empty string where to append corrected words
  var messageMisspelledFree = "";
  var words = message.text.split(" ");
  // initially assume there is no correction neeeded
  showNewSentence = false

  for (var i = 0; i < words.length; i++) {

    // check for each word if is it misspelled
    if (speller.correct(words[i]) == false && isNaN(words[i]) ) {
      
      var corrections = speller.suggest(words[i])
      if (corrections.length > 0) {
        // if it is and at least a correction exists append the first one
        messageMisspelledFree += corrections[0] + ' ';
        // set the global var to true in order to show that a correction happened
        // in the next response to the user
        showNewSentence = true
      }
      else {
        // otherwise append the original word
        messageMisspelledFree += words[i] + ' ';
      }
    }
    else {
      // otherwise append the original word
      messageMisspelledFree += words[i] + ' ';
    }
  }
  return messageMisspelledFree;
}

// FIXED GREETINGS (USEFUL ONLY FOR LANGUAGE DETECTION)
var greetings = {};
greetings["hello"] = true;
greetings["hi"] = true;
greetings["good morning"] = true;
greetings["hey"] = true;
greetings["bonjour"] = true;
greetings["bonsoir"] = true;
greetings["salut"] = true;


var isGreetings = function(message) {
  var lowerCaseMessage = message.text.toLowerCase();
  if (greetings[lowerCaseMessage]) return true;
  return false;
}


// SLACK
var slackBotOptions = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    debug: false,
    scopes: ['bot'],
};
var slackController = Botkit.slackbot(slackBotOptions);
var slackBot = slackController.spawn({
    token: process.env.slackToken,
});


// FB MESSENGER
var fbBotOptions = {
  debug: true,
  log: true,
  access_token: process.env.fbAccessToken,
  verify_token: process.env.fbVerifyToken,
  app_secret: process.env.fbAppSecret,
  validate_requests: true
};
var fbController = Botkit.facebookbot(fbBotOptions);
var fbBot = fbController.spawn({  
});

fbController.setupWebserver(
      process.env.PORT || 5000,
      (err, webserver) => {
        fbController.createWebhookEndpoints(webserver, fbBot);
      }
);

// 'Dialogflow' MIDDLEWARE
var dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    token: process.env.dialogflow,
});


// SLACK: 'SpellChecker' MIDDLEWARE INIT
slackController.middleware.receive.use((bot, message, next) => {
  if (!message.text) {
    next();
    return;
  }

  if (message.is_echo || message.type === 'self_message') {
    next();
    return;
  }
  
  // trigger language detection in case of long sentences or greetings
  if (message.text.split(" ").length > 1 || isGreetings(message) ) {

    // LANGUAGE CHECK
    // prepare arguments for the request to Google Translate API
    var url = "https://translate.googleapis.com/translate_a/single"
    var parameters = { 
        q: message.text, 
        dt: 't',
        tl: 'it',
        sl: 'auto',
        client: 'gtx',
        hl: 'it'
    };

    request({url:url, qs:parameters}, function(err, response, body) {
      if (err) {
        console.log("Error during language detection");
        next(err);
      }

      // get language from json
      var res = JSON.parse(body);
      var lang = res[2];

      // update accordingly the speller and the global var 
      if (lang == "fr") {
        speller = spellFR;
        currentLang = "fr";
      } else if (lang == "en") {
        speller = spellEN;
        currentLang = "en";
      }
      //otherwise don't change anything
      
      // SPELL CHECKING
      // perform the misspelling with the (potentially) updated speller
      var cleanMessage = performMisspellingCheck(message)
      message.text = cleanMessage;
      // fill the language field in order to send it to dialogflow api
      message.lang = currentLang;
      next()
    });
  }
  else {

    // perform the misspelling with the same speller as before
    var cleanMessage = performMisspellingCheck(message)
    message.text = cleanMessage;

    // fill the language field in order to send it to dialogflow api
    message.lang = currentLang;
    next();
  }
  return;
});


// SLACK: 'Dialogflow' MIDDLEWARE INIT
slackController.middleware.receive.use(dialogflowMiddleware.receive);

// FACEBOOK: 'SpellChecker' MIDDLEWARE INIT
fbController.middleware.receive.use((bot, message, next) => {
  if (!message.text) {
    next();
    return;
  }

  if (message.is_echo || message.type === 'self_message') {
    next();
    return;
  }
  
  if (message.text.split(" ").length > 1 || isGreetings(message) ) {

    // LANGUAGE CHECK
    // update current dictionary if necessary
    var url = "https://translate.googleapis.com/translate_a/single"
    var parameters = { 
        q: message.text, 
        dt: 't',
        tl: 'it',
        sl: 'auto',
        client: 'gtx',
        hl: 'it'
    };

    request({url:url, qs:parameters}, function(err, response, body) {
      if (err) {
        console.log("Error during language detection");
        next(err);
      }
	  
      //detect language from json
      var res = JSON.parse(body);
      var lang = res[2];

      if (lang == "fr") {
        speller = spellFR;
        currentLang = "fr";
      }
      else if (lang == "en") {
        speller = spellEN;
        currentLang = "en";
      }
      //otherwise don't change anything
      
      // SPELL CHECK
      var cleanMessage = performMisspellingCheck(message)
      message.text = cleanMessage;
      message.lang = currentLang;
      next()
    });
  }
  else {

    // perform the misspelling with the same speller as before
    var cleanMessage = performMisspellingCheck(message)
    message.text = cleanMessage;

    // fill the language field in order to send it to dialogflow api
    message.lang = currentLang;
    next();
  }
  return;
});

// FACEBOOK: 'Dialogflow' MIDDLEWARE INIT
fbController.middleware.receive.use(dialogflowMiddleware.receive);

// BOT: START THE SERVICE
slackBot.startRTM();

// EXPORTS
exports.slackController = slackController;
exports.slackBot = slackBot;
exports.dialogflowMiddleware = dialogflowMiddleware;
exports.fbController = fbController;
exports.showNewSentence = function() {return showNewSentence};
exports.currectLang = function() {return currentLang};

// IMPORT HEARS
var slackHears = require('./slack/slack_hears.js');
var fbHears = require('./facebook/facebook_hears.js');
