/* FACEBOOK HEARS */

var botVars = require("../bot.js");
var botFunctions = require("../doremus/bot_functions.js");

// ANY INTENT
//botVars.fbController.hears('(.*)', 'message_received, facebook_postback', function(bot, message) {
//    bot.reply(message, "Ma che davero?");
//});

// WORKS-BY INTENT
module.exports.worksBy = botVars.fbController.hears('works-by', 'message_received, facebook_postback', botVars.dialogflowMiddleware.hears, function(bot, message) {
  
  // GET PARAMETERS
  var parameters = {
   artist: message.entities["doremus-artist"],
   prevArtist: message.entities["doremus-artist-prev"],
   number: message.entities["number"],
   instruments: message.entities["doremus-instrument"],
   strictly: message.entities["doremus-strictly"],
   year: message.entities["date-period"],
   genre: message.entities["doremus-genre"]
  }
  
  
  // COUNT OF THE FILTER SET BY THE USER
  var filterCounter = 0;
  for (var key in parameters) {
    if (typeof parameters[key] === "string" && parameters[key] !== "") {
      filterCounter++;
    }
    else if (typeof parameters[key] !== "string" && parameters[key].length != 0) {
      filterCounter++;
    }
  }
   
  // CHECK IF THE MAX AMOUNT OF FILTERS IS APPLIED
  if (filterCounter > 2) {

    // YEAR CHECK AND PARSING
    var startyear = null;
    var endyear = null;
    console.log(parameters.year);
    if (parameters.year !== "") {
      startyear = parseInt(parameters.year.split("/")[0]);
      endyear = parseInt(parameters.year.split("/")[1]);

      // SWAP IF PROVIDED IN THE INVERSE ORDER
      if (startyear > endyear) {
        var tmp = startyear;
        startyear = endyear;
        endyear = tmp;
      }
    }

    // ARTIST PARSING
    if (parameters.artist == "" && parameters.prevArtist !== "") {
      parameters.artist = parameters.prevArtist;
    }

    // DO THE QUERY (WITH ALL THE INFOS)
    botFunctions.doQuery(parameters.artist, parameters.number, parameters.instruments, 
            parameters.strictly, startyear, endyear, parameters.genre, "facebook", bot, message);
  }
  else {
    
    bot.reply(message, message['fulfillment']['speech']);
  }
  
});

// WORKS-BY - YES INTENT
module.exports.worksByYes = botVars.fbController.hears('works-by - yes', 'message_received, facebook_postback', botVars.dialogflowMiddleware.hears, function(bot, message) {
   
  bot.reply(message, message['fulfillment']['speech']);
});

// WORKS-BY - NO
module.exports.worksByNo = botVars.fbController.hears('works-by - no', 'message_received, facebook_postback', botVars.dialogflowMiddleware.hears, function(bot, message) {
  
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
  botFunctions.doQuery(artist, number, instruments, strictly, startyear, endyear, genre, "facebook", bot, message);
  
});


// WORKS-BY-SOMETHING INTENT
module.exports.worksBySomething = botVars.fbController.hears(['works-by-artist','works-by-genre','works-by-instrument','works-by-years'], 'message_received, facebook_postback', botVars.dialogflowMiddleware.hears, function(bot, message) {

  bot.reply(message, message['fulfillment']['speech']);
});


// DISCOVER ARTIST
module.exports.findArtist = botVars.fbController.hears('find-artist', 'message_received, facebook_postback', botVars.dialogflowMiddleware.hears, function(bot, message) {
    
    // GET ENTITIES
    var date = message.entities["date-period"];
    var number = message.entities["number"];
    var place = message.entities["geo-city"];
    var instrument = message.entities["doremus-instrument"];
    var genre = message.entities["doremus-genre"];
  
    // PARSE ENTITIES
    var startdate = "";
    var enddate = "";
    if (date !== "") {
      startdate = date.split("/")[0];
      enddate = date.split("/")[1];
    }
  
    var num = 5;
    if (number !== "") {
      num = parseInt(number);
    }
  
    var city = "";
    if (place !== "") {
      city = place.toLowerCase();
    } 
  
    // SEND THE BIO TO THE USER
    botFunctions.doQueryFindArtist(num, startdate, enddate, city, instrument, genre, "facebook", bot, message);
});


// DISCOVER ARTIST
module.exports.discoverArtist = botVars.fbController.hears('discover-artist', 'message_received, facebook_postback', botVars.dialogflowMiddleware.hears, function(bot, message) {
  
  // ACTION COMPLETE (we have all the required infos)
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    // SEND THE BIO TO THE USER
    botFunctions.answerBio(message.entities["doremus-artist"], "facebook", bot, message);
  }
  
  // ACTION INCOMPLETE (the artist names hasn't been provided or it was misspelled)
  else {
      
    bot.reply(message, message['fulfillment']['speech']);
  }
  
});


// FIND-PERFORMANCE
module.exports.findPerformance = botVars.fbController.hears('find-performance', 'message_received, facebook_postback', botVars.dialogflowMiddleware.hears,  function(bot, message) {
  
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
    botFunctions.doQueryPerformance(num, city, startdate, enddate, "facebook", bot, message);
  }
  
  // ACTION INCOMPLETE (missing date)
  else {
    bot.reply(message, message['fulfillment']['speech']);
  }
});


// HELLO INTENT
module.exports.hello = botVars.fbController.hears('hello', 'message_received', botVars.dialogflowMiddleware.hears, function(bot, message) {
  console.log(message);
  bot.reply(message, message['fulfillment']['speech']);
});


// DEFAULT INTENT
module.exports.default = botVars.fbController.hears('Default Fallback Intent', 'message_received, facebook_postback', function(bot, message) {
  
  bot.reply(message, message['fulfillment']['speech']);
});
