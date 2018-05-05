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

var dictIT = require('dictionary-it')
var dictFR = require('dictionary-fr')


var path = require('path')
var base = require.resolve('dictionary-it')

var enDIC = fs.readFileSync("/app/node_modules/dictionary-en-us/index.dic", 'utf-8')
var enAFF = fs.readFileSync("/app/node_modules/dictionary-en-us/index.aff", 'utf-8')
var spellEN = nspell(enAFF, enDIC)


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
  
  // apply spell checking for each word of the text before sending dialogflow
  var messageMisspelledFree = "";
  var words = message.text.split(" ");
  
  for (var i = 0; i < words.length; i++) {
    if (spellEN.correct(words[i]) == false) {
      var corrections = spellEN.suggest(words[i])
      if (corrections.length > 0) {
        messageMisspelledFree += corrections[0] + ' ';
      } else {
        messageMisspelledFree += words[i] + ' ';
      }
    } else {
      messageMisspelledFree += words[i] + ' ';
    }
  }
  message.text = messageMisspelledFree;
  console.log(message.text)
  next()
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
  
  // apply spell checking for each word of the text before sending dialogflow
  var messageMisspelledFree = "";
  var words = message.text.split(" ");
  
  for (var i = 0; i < words.length; i++) {
    if (spellEN.correct(words[i]) == false) {
      var corrections = spellEN.suggest(words[i])
      if (corrections.length > 0) {
        messageMisspelledFree += corrections[0] + ' ';
      } else {
        messageMisspelledFree += words[i] + ' ';
      }
    } else {
      messageMisspelledFree += words[i] + ' ';
    }
  }
  message.text = messageMisspelledFree;
  console.log(message.text)
  next()
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
