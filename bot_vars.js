// VARIABLES DECLARATION
var Botkit = require('botkit');
var FuzzySet = require('fuzzyset.js');
var request = require('request');
var http = require('http');
var SpellChecker = require('spellchecker')
var bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    //debug: true,
    scopes: ['bot'],
};
var slackController = Botkit.slackbot(bot_options);
var slackBot = slackController.spawn({
    token: process.env.token,
});
var dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    token: process.env.dialogflow,
});

// EXPORTS
exports.slackController = slackController;
exports.slackBot = slackBot;
exports.dialogflowMiddleware = dialogflowMiddleware;
exports.SpellChecker = SpellChecker
