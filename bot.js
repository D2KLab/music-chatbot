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
  
  console.log(message['nlpResponse']['result']['contexts']);
  
  // ACTION COMPLETE (the artist name has been provided)
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    // GET PARAMETERS
    var artist = message.entities["doremus-artist"];
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
    
    // DO THE QUERY (WITH ALL THE INFOS)
    doQuery(artist, number, instruments, strictly, startyear, endyear, genre, bot, message);
  }
  
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


// WORKS-BY-DISCOVERED-ARTIST INTENT
slackController.hears(['works-by-discovered-artist'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
    // GET PARAMETERS
    var artist = message.entities["doremus-artist"];
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

    // DO THE QUERY (WITH ALL THE INFOS)
    doQuery(artist, number, instruments, strictly, startyear, endyear, genre, bot, message);
      
});


// PROPOSE-PERFORMANCE
slackController.hears(['find-performance'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  // ACTION COMPLETE (the artist name has been provided)
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    var date = message.entities["date-period"];
    var place = message.entities["geo-city"];
    
    var city = "";
    if (place !== "") {
      city = place.toLowerCase();
    }
    
    var startdate, enddate;
    var startyear = "2018", endyear = "2018";
    var startmonth = "2018-05", endmonth = "2018-05";
    var startday = "--05-01", endday = "--05-31";
    if (date !== "") {
      startdate = date.split("/")[0];
      enddate = date.split("/")[1];
      
      startyear = startdate.split("-")[0];
      startmonth = startyear + "-" + startdate.split("-")[1];
      startday = "--" + startdate.split("-")[1] + "-" + startdate.split("-")[2];
      
      endyear = enddate.split("-")[0];
      endmonth = endyear + "-" + enddate.split("-")[1];
      endday = "--" + enddate.split("-")[1] + "-" + enddate.split("-")[2];
    }
    
    // DO THE QUERY (WITH ALL THE INFOS)
    doQueryPerformance(city, startyear, startmonth, startday, endyear, endmonth, endday, bot, message);
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
