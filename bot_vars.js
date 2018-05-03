// VARIABLES DECLARATION
var Botkit = require('botkit');
var FuzzySet = require('fuzzyset.js');
var request = require('request');
var http = require('http');
var SpellChecker = require('spellchecker')

/* SLACK */
var slackBotOptions = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    //debug: true,
    scopes: ['bot'],
};
var slackController = Botkit.slackbot(slackBotOptions);
var slackBot = slackController.spawn({
    token: process.env.token,
});



/* FB MESSENGER */ 
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



var dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    token: process.env.dialogflow,
});



// EXPORTS
exports.slackController = slackController;
exports.slackBot = slackBot;
exports.dialogflowMiddleware = dialogflowMiddleware;
exports.SpellChecker = SpellChecker;
exports.fbController = fbController;
