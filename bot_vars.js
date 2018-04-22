// VARIABLES DECLARATION
var Botkit = require('botkit');
var FuzzySet = require('fuzzyset.js');
var request = require('request');
var http = require('http');
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
var alreadyAskedCount = 0;
var alreadyAsked = false;

// LOAD IN MEMORY ORIGINAL NAMES TO HANDLE MISSPELLED ONES
var misspellingSolver = FuzzySet();
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('names.txt')
});
lineReader.on('line', function (line) {
  misspellingSolver.add(line);
});

// LOAD IN MEMORY POPULARITY INFORMATION
var popularityDictionary = {};
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('popularity.csv')
});
lineReader.on('line', function (line) {
  var fields = line.split(','); 
  popularityDictionary[fields[0]] = fields[1];
});

// EXPORTS
exports.misspellingSolver = misspellingSolver;
exports.slackController = slackController;
exports.slackBot = slackBot;
exports.dialogflowMiddleware = dialogflowMiddleware;
exports.alreadyAskedCount = alreadyAskedCount;
exports.popularityDictionary = popularityDictionary;
exports.lineReader = lineReader;
