/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
            
This is the DOREMUS Bot! Built with Botkit, using the Dialogflow middleware.

Authors:
  - Luca LOMBARDO
  - Claudio SCALZO
  
Supported platforms:
  - Slack
  - Facebook Messenger

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

// VARIABLES DECLARATION
var Botkit = require('botkit');
var request = require('request');
var http = require('http');
var nspell = require('nspell')
const fs = require('fs');
var comm = "";

var enDIC = fs.readFileSync("/app/node_modules/dictionary-en-us/index.dic", 'utf-8')
var enAFF = fs.readFileSync("/app/node_modules/dictionary-en-us/index.aff", 'utf-8')
var spellEN = nspell(enAFF, enDIC)

var frDIC = fs.readFileSync("/app/node_modules/dictionary-fr/index.dic", 'utf-8')
var frAFF = fs.readFileSync("/app/node_modules/dictionary-fr/index.aff", 'utf-8')
var spellFR = nspell(frAFF, frDIC)

/*
var itDIC = fs.readFileSync("/app/dictionaries/it.dic", 'utf-8')
var itAFF = fs.readFileSync("/app/dictionaries/it.aff", 'utf-8')
var spellEN = nspell(itAFF, itDIC)
*/

var speller = spellEN
var currentLang = "en"


// CHECKS FOR THE SLACK AND DIALOGFLOW TOKENS
if (!process.env.token) {
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

var performMisspellingCheck = function(message) {
  var messageMisspelledFree = "";
  var words = message.text.split(" ");

  for (var i = 0; i < words.length; i++) {
    if (speller.correct(words[i]) == false) {
      var corrections = speller.suggest(words[i])
      if (corrections.length > 0) {
        messageMisspelledFree += corrections[0] + ' ';
      } else {
        messageMisspelledFree += words[i] + ' ';
      }
    } else {
      messageMisspelledFree += words[i] + ' ';
    }
  }
  return messageMisspelledFree;
}

var greetings = {};
greetings["hello"] = true;
greetings["hi"] = true;
greetings["good morning"] = true;
greetings["hey"] = true;
greetings["bonjour"] = true;
greetings["salut"] = true;


var isGreetings = function(message) {
  var lowerCaseMessage = message.text.toLowerCase();
  if(greetings[lowerCaseMessage]) return true;
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
    token: process.env.token,
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
      3000,
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
  
  if (message.text.split(" ").length > 1 || isGreetings(message) ) {
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
        console.log("ERROR DURING LANGUAGE DETECTION");
        next(err);
      }
      //detect language from json
      var res = JSON.parse(body);
      var lang = res[2];

      if (lang == "fr") {
        console.log("SWTICHED TO FR");
        speller = spellFR;
        currentLang = "fr";
      } else if (lang == "en") {
        console.log("SWTICHED TO EN");
        speller = spellEN;
        currentLang = "en";
      }
      //otherwise don't change anything
      
      var cleanMessage = performMisspellingCheck(message)
      message.text = cleanMessage;
      console.log("to dialogflow: ", message.text)
      message.language = currentLang;
      next()
    });
  } else {
    console.log("I STAY IN " + currentLang);
    var cleanMessage = performMisspellingCheck(message)
    message.text = cleanMessage;
    console.log("to dialogflow: ", message.text)
    message.language = currentLang;
    next();
  }
  return;
    
  /*
  if (message.text == "hi") {
    console.log("SWITCHED TO EN");
    speller = spellEN;
    currentLang = "en";
  }
  else if (message.text == "bonjour") {
    console.log("SWITCHED TO FR")
    speller = spellFR
    currentLang = "fr";
  }
  */
  // apply spell checking for each word of the text before sending dialogflow
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
        console.log("ERROR DURING LANGUAGE DETECTION");
        next(err);
      }
      //detect language from json
      var res = JSON.parse(body);
      var lang = res[2];

      if (lang == "fr") {
        console.log("SWTICHED TO FR");
        speller = spellFR;
        currentLang = "fr";
      } else if (lang == "en") {
        console.log("SWTICHED TO EN");
        speller = spellEN;
        currentLang = "en";
      }
      //otherwise don't change anything
      
      var cleanMessage = performMisspellingCheck(message)
      message.text = cleanMessage;
      console.log("to dialogflow: ", message.text)
      message.language = currentLang;
      next()
    });
  } else {
    console.log("I STAY IN " + currentLang);
    var cleanMessage = performMisspellingCheck(message)
    message.text = cleanMessage;
    console.log("to dialogflow: ", message.text)
    message.language = currentLang;
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

// IMPORT HEARS
var slackHears = require('./slack/slack_hears.js');
var fbHears = require('./facebook/facebook_hears.js');
