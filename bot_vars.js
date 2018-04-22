// VARIABLES DECLARATION
var Botkit = require('botkit');
var FuzzySet = require('fuzzyset.js'); exports.FuzzySet = FuzzySet;
var request = require('request');
var http = require('http');
var bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    //debug: true,
    scopes: ['bot'],
};
var slackController = Botkit.slackbot(bot_options); exports.slackController = slackController;
var slackBot = slackController.spawn({
    token: process.env.token,
}); exports.slackBot = slackBot;
var dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    token: process.env.dialogflow,
}); exports.dialogflowMiddleware = dialogflowMiddleware;
var alreadyAskedCount = 0; exports.alreadyAskedCount = alreadyAskedCount;

// LOAD IN MEMORY ORIGINAL NAMES TO HANDLE MISSPELLED ONES
var misspellingSolver = FuzzySet(); exports.misspellingSolver = misspellingSolver;
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('names.txt')
}); exports.lineReader = lineReader;
lineReader.on('line', function (line) {
  misspellingSolver.add(line);
}); exports.lineReader = lineReader;

// LOAD IN MEMORY POPULARITY INFORMATION
var popularityDictionary = {}; exports.popularityDictionary = popularityDictionary;
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('popularity.csv')
});
lineReader.on('line', function (line) {
  var fields = line.split(','); 
  popularityDictionary[fields[0]] = fields[1];
}); exports.lineReader = lineReader;