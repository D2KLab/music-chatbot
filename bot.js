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
      
  // GET PARAMETERS
  var artist = message.entities["doremus-artist"];
  var prevArtist = message.entities["doremus-artist-prev"];
  var number = message.entities["number"];
  var instruments = message.entities["doremus-instrument"];
  var strictly = message.entities["doremus-strictly"];
  var year = message.entities["date-period"];
  var genre = message.entities["doremus-genre"];
  
  // CHECK IF THE MAX AMOUNT OF FILTERS IS APPLIED
  if (instruments.length > 0) {

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
  else {
    
    bot.reply(message, message['fulfillment']['speech']);
  }
  
});

// WORKS-BY - YES INTENT
slackController.hears(['works-by - yes'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
   
  bot.reply(message, message['fulfillment']['speech']);
});

// WORKS-BY - NO
slackController.hears(['works-by - no'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  var context = message["nlpResponse"]["result"]["contexts"][0];
  
  // GET PARAMETERS
  var artist = context["parameters"]["doremus-artist"];
  var prevArtist = context["parameters"]["doremus-artist-prev"];
  var number = context["parameters"]["number"];
  var instruments = context["parameters"]["doremus-instrument"];
  var strictly = context["parameters"]["doremus-strictly"];
  var year = context["parameters"]["date-period"];
  var genre = context["parameters"]["doremus-genre"];

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
  
});


// WORKS-BY-INSTRUMENT INTENT
slackController.hears(['works-by-instrument'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
   
  bot.reply(message, message['fulfillment']['speech']);
});


// WORKS-BY-INSTRUMENT INTENT
slackController.hears(['works-by-genre'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
   
  bot.reply(message, message['fulfillment']['speech']);
});


// DISCOVER ARTIST
slackController.hears(['discover-artist'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  // ACTION COMPLETE (we have all the required infos)
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    // SEND THE BIO TO THE USER
    answerBio(bot, message, message.entities["doremus-artist"]);
  }
  
  // ACTION INCOMPLETE (the artist names hasn't been provided or it was misspelled)
  else {
      
    bot.reply(message, message['fulfillment']['speech']);
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
