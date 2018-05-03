/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
            
This is the DOREMUS Slack Bot! Built with Botkit, using the Dialogflow middleware.

Authors:
  - Luca LOMBARDO
  - Claudio SCALZO
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */


// LOAD VARIABLES
var botVars = require("./bot_vars.js");
var botFunctions = require("./bot_functions.js");

// RENAME (for readability)
var slackController = botVars.slackController;
var fbController = botVars.fbController;
var slackBot = botVars.slackBot;
var dialogflowMiddleware = botVars.dialogflowMiddleware;
var SpellChecker = botVars.SpellChecker;

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
    if (SpellChecker.isMisspelled(words[i])) {
      var corrections = SpellChecker.getCorrectionsForMisspelling(words[i])
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
  next();
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
    if (SpellChecker.isMisspelled(words[i])) {
      var corrections = SpellChecker.getCorrectionsForMisspelling(words[i])
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
  next();
  return;
});

// FACEBOOK: 'Dialogflow' MIDDLEWARE INIT
fbController.middleware.receive.use(dialogflowMiddleware.receive);

// BOT: START THE SERVICE
slackBot.startRTM();
