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
require('dotenv').config({
    path: './config/.env'
});

// VARIABLES DECLARATION
var Botkit = require('botkit');
var request = require('request');
var http = require('http');
var logger = require('./logger.js');

// CHECKS FOR THE SLACK AND DIALOGFLOW TOKENS
if (!process.env.slackToken) {
    console.error('Specify Slack token in environment');
    process.exit(1);
}

if (!process.env.dialogflow) {
    console.error('Specify Dialogflow token in environment');
    process.exit(1);
}

if (!process.env.fbAccessToken || !process.env.fbVerifyToken || !process.env.fbAppSecret) {
    console.error('Specify Facebook tokens in environment');
    process.exit(1);
}

if (!process.env.PORT2) {
    console.error('Specify PORT2 token in environment to launch dialogflow webhook');
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
var fbBot = fbController.spawn({});

fbController.setupWebserver(
    process.env.PORT || 5000,
    (err, webserver) => fbController.createWebhookEndpoints(webserver, fbBot)
);


// WEBHOOK SERVER
require("./dialogflow/index.js")(process.env.PORT2);

// LOAD 'SpellChecker' MIDDLEWARE
var spellCheckerMiddleware = require('./spell-checker-middleware.js')()

// LOAD 'Dialogflow' MIDDLEWARE
var dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    token: process.env.dialogflow,
	sessionIdProps: ['channel'],
});


// SLACK: 'SpellChecker' MIDDLEWARE INIT
slackController.middleware.receive.use(spellCheckerMiddleware.receive);

// SLACK: 'Dialogflow' MIDDLEWARE INIT
slackController.middleware.receive.use(dialogflowMiddleware.receive);


// FACEBOOK: 'SpellChecker' MIDDLEWARE INIT
fbController.middleware.receive.use(spellCheckerMiddleware.receive);

// FACEBOOK: 'Dialogflow' MIDDLEWARE INIT
fbController.middleware.receive.use(dialogflowMiddleware.receive);


// START THE LOGGER
log = logger();

// BOT: START THE SERVICE
slackBot.startRTM();


// EXPORTS
exports.slackController = slackController;
exports.fbController = fbController;
exports.slackBot = slackBot;
exports.dialogflowMiddleware = dialogflowMiddleware;
exports.spellCheckerMiddleware = spellCheckerMiddleware;
exports.log = function() {
    return log;
}

// IMPORT HEARS
var slackHears = require('./slack/slack_io.js');
var fbHears = require('./facebook/facebook_io.js');