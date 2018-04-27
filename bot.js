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
var botvars = require("./bot_vars.js");
var slackController = botvars.slackController;
var dialogflowMiddleware = botvars.dialogflowMiddleware;
var slackBot = botvars.slackBot;

// LOAD FUNCTIONS
var botfunctions = require("./bot_functions.js");
var doQuery = botfunctions.doQuery;
var doQueryPerformance = botfunctions.doQueryPerformance;
var sendClearContext = botfunctions.sendClearContext;
var answerBio = botfunctions.answerBio;


// CHECKS FOR THE SLACK AND DIALOGFLOW TOKENS
if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

if (!process.env.dialogflow) {
    console.log('Error: Specify dialogflow in environment');
    process.exit(1);
}


// INITs
slackController.middleware.receive.use(dialogflowMiddleware.receive);
slackBot.startRTM();


// WORKS-BY INTENT
slackController.hears(['works-by'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
   // ACTION COMPLETE (the artist name has been provided)
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    // GET PARAMETERS
    var artist = message.entities["doremus-artist"];
    var prevArtist = message.entities["doremus-artist-prev"];
    var number = message.entities["number"];
    var instruments = message.entities["doremus-instrument"];
    var strictly = message.entities["doremus-strictly"];
    var year = message.entities["date-period"];
    var genre = message.entities["doremus-genre"];
    
    // YEAR CHECK AND PARSING
    var startyear = null;
    var endyear = null;
    if (year !== "") {
      startyear = parseInt(year.split("/")[0]);
      endyear = parseInt(year.split("/")[1]);
      
      // SWAP IF PROVIDED IN THE INVERSE ORDER
      if (startyear > endyear) {
        var tmp = startyear;
        startyear = endyear;
        endyear = tmp;
      }
    }
    
    // ARTIST PARSING
    if (artist === "" && prevArtist !== "") {
      artist = prevArtist;
    }
    
    // DO THE QUERY (WITH ALL THE INFOS)
    doQuery(artist, number, instruments, strictly, startyear, endyear, genre, bot, message);
  }
  
});

// WORKS-BY-INSTRUMENT INTENT
slackController.hears(['works-by-instrument'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
   
  bot.reply(message, message['fulfillment']['speech']);
});

// WORKS-BY - YES
slackController.hears(['works-by - yes'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
   // ACTION COMPLETE (the artist name has been provided)
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    // GET PARAMETERS
    var artist = message.entities["doremus-artist"];
    var prevArtist = message.entities["doremus-artist-prev"];
    var number = message.entities["number"];
    var instruments = message.entities["doremus-instrument"];
    var strictly = message.entities["doremus-strictly"];
    var year = message.entities["date-period"];
    var genre = message.entities["doremus-genre"];
    
    // YEAR CHECK AND PARSING
    var startyear = null;
    var endyear = null;
    if (year !== "") {
      startyear = parseInt(year.split("/")[0]);
      endyear = parseInt(year.split("/")[1]);
      
      // SWAP IF PROVIDED IN THE INVERSE ORDER
      if (startyear > endyear) {
        var tmp = startyear;
        startyear = endyear;
        endyear = tmp;
      }
    }
    
    // ARTIST PARSING
    if (artist === "" && prevArtist !== "") {
      artist = prevArtist;
    }
    
    // DO THE QUERY (WITH ALL THE INFOS)
    doQuery(artist, number, instruments, strictly, startyear, endyear, genre, bot, message);
  }
  
});


// PROPOSE-PERFORMANCE
slackController.hears(['find-performance'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  // ACTION COMPLETE (the date has been provided)
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    var date = message.entities["date-period"];
    var place = message.entities["geo-city"];
    var number = message.entities["number"];
    
    var city = "";
    if (place !== "") {
      city = place.toLowerCase();
    }
    
    var num = 1;
    if (number !== "") {
      num = parseInt(number);
    }
    
    var startdate = date.split("/")[0];
    var enddate = date.split("/")[1];
    
    // DO THE QUERY (WITH ALL THE INFOS)
    doQueryPerformance(num, city, startdate, enddate, bot, message);
  }
  
  // ACTION INCOMPLETE (missing date)
  else {

    bot.reply(message, message['fulfillment']['speech']);
  }
});


// HELLO INTENT
slackController.hears(['hello'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  bot.reply(message, message['fulfillment']['speech']);
});


// DEFAULT INTENT
slackController.hears(['Default Fallback Intent'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  bot.reply(message, message['fulfillment']['speech']);
});
