var botVars = require("./bot_vars.js");
var botFunctions = require("./bot_functions.js");

// ANY INTENT
botVars.fbController.hears('(.*)', 'message_received, facebook_postback', function(bot, message) {
    bot.reply(message, "Ma che davero?");
});