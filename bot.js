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

// CHECKS FOR THE SLACK AND DIALOGFLOW TOKENS
if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

if (!process.env.dialogflow) {
    console.log('Error: Specify dialogflow in environment');
    process.exit(1);
}


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
var misspellingSolver = FuzzySet();
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('names.txt')
});
lineReader.on('line', function (line) {
  misspellingSolver.add(line);
});
var intentThrowsMisspelled = "";

// FUNCTIONS
var sendClearContext = function(sessionID) {
  var request = require('request');
  var options = {
    method: 'DELETE',
    uri: 'https://api.dialogflow.com/v1/contexts?sessionId=' + sessionID,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.dialogflow
    }
  };
  
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      // console.log(body);
      // console.log(response);
    }
  }
  request(options, callback)
}

var getBioCard = function(fullname, birthPlace, birthDate, deathPlace, deathDate, imageURL, bio) {
  var imageURLHTTPDropped = imageURL.split("://")[1]
  var bioAttachment = {
    "attachments": [{
        "pretext": "This is what I found:",
        "fallback": "ReferenceError - UI is not defined: https://honeybadger.io/path/to/event/",
        "title" : fullname,
        "image_url": "https://rsz.io/" + imageURLHTTPDropped + "?mode=crop&width=150&height=150",
        "fields": [
            {
                "title": "Born in",
                "value": birthPlace,
                "short": true
            },
            {
                "title": "Birthdate",
                "value": birthDate,
                "short": true
            },
            {
                "title": "Dead in",
                "value": deathPlace,
                "short": true
            },
            {
                "title": "Death date",
                "value": deathDate,
                "short": true
            },
            {
                "title": "Bio",
                "value": bio, 
                "short": false
            }
        ],
        "color": "good"
    }]
  }
  return bioAttachment;
}

function doQuery(artist, number, instrument, strictly, bot, message) {
  
  // DEFAULT NUMBER VALUE (IN CASE IS NOT GIVEN)
  if (isNaN(parseInt(number))) {
    number = 10;
  }

  // JSON QUERY  
  // -> Init query
  var newQuery = 'SELECT DISTINCT ?title \
    WHERE { \
      ?expression a efrbroo:F22_Self-Contained_Expression ; \
        rdfs:label ?title ; \
        mus:U13_has_casting ?casting . \
      ?expCreation efrbroo:R17_created ?expression ; \
        ecrm:P9_consists_of / ecrm:P14_carried_out_by ?composer . \
      VALUES(?composer) { \
        (<http://data.doremus.org/artist/' + artist + '>) \
      }'
  
  // -> No instrument
  if (instrument == null) {
    
    newQuery += '} \
                 ORDER BY rand() \
                 LIMIT ' + number
  }
  // -> Just one instrument
  else if (typeof instrument == "string") {
  
    newQuery += '?casting mus:U23_has_casting_detail ?castingDetail . \
                 ?castingDetail mus:U2_foresees_use_of_medium_of_performance ?instrument . \
                 VALUES(?instrument) { \
                   (<http://data.doremus.org/vocabulary/iaml/mop/' + instrument + '>) \
                 } \
               } \
               ORDER BY rand() \
               LIMIT ' + number
  }
  // -> List of instruments
  else {
    
    // AND case
    if (strictly === "and") {
      for (var i = 0; i < instrument.length; i++) {
        newQuery += '?casting mus:U23_has_casting_detail ?castingDetail' + i + ' . \
                     ?castingDetail' + i + ' mus:U2_foresees_use_of_medium_of_performance ?instrument' + i + ' . \
                     VALUES(?instrument' + i + ') { \
                       (<http://data.doremus.org/vocabulary/iaml/mop/' + instrument[i] + '>) \
                     }'
      }

      newQuery += '} \
                   ORDER BY rand() \
                   LIMIT ' + number
    }
    // OR case
    else {
      newQuery += '?casting mus:U23_has_casting_detail ?castingDetail . \
                   ?castingDetail mus:U2_foresees_use_of_medium_of_performance ?instrument . \
                   VALUES(?instrument) {'

      for (var i = 0; i < instrument.length; i++) {
        newQuery += '(<http://data.doremus.org/vocabulary/iaml/mop/' + instrument[i] + '>)'
      }

      newQuery += '} \
                 } \
                 ORDER BY rand() \
                 LIMIT ' + number
    }
  }
  
  // -> Finalize the query
  var queryPrefix = 'http://data.doremus.org/sparql?default-graph-uri=&query='
  var querySuffix = '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
  var finalQuery = queryPrefix + encodeURI(newQuery) + querySuffix
  
  // -> Do the HTTP request
  const request = require('request');
  request(finalQuery, (err, res, body) => {

    if (err) { return console.log(err); }

    // JSON PARSING
    var json = JSON.parse(body)

    // RESPONSE
    if (json["results"]["bindings"].length === 0) {
      
      bot.reply(message, "Sorry... I didn't find anything!");
    }
    else {
      var resp = "This is the list:\n";
      json["results"]["bindings"].forEach(function(row) {
        resp += ("  >  " + row["title"]["value"] + "\n");
      });

      bot.reply(message, resp);
    }

  });
}

var answerBio = function(bot, message, artist) {
  
    var query = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Fcomposer%2C+%3Fname%2C+%3Fbio%2C+xsd%3Adate%28%3Fd_date%29+as+%3Fdeath_date%2C+%3Fdeath_place%2C+xsd%3Adate%28%3Fb_date%29+as+%3Fbirth_date%2C+%3Fbirth_place%2C+%3Fimage%0D%0AWHERE+%7B%0D%0A++VALUES%28%3Fcomposer%29+%7B%28%3Chttp%3A%2F%2Fdata.doremus.org%2Fartist%2F" + artist +"%3E%29%7D+.%0D%0A++%3Fcomposer+foaf%3Aname+%3Fname+.%0D%0A++%3Fcomposer+rdfs%3Acomment+%3Fbio+.%0D%0A++%3Fcomposer+foaf%3Adepiction+%3Fimage+.%0D%0A++%3Fcomposer+schema%3AdeathDate+%3Fd_date+.%0D%0A++%3Fcomposer+dbpprop%3AdeathPlace+%3Fd_place+.%0D%0A++OPTIONAL+%7B+%3Fd_place+rdfs%3Alabel+%3Fdeath_place+%7D+.%0D%0A++%3Fcomposer+schema%3AbirthDate+%3Fb_date+.%0D%0A++%3Fcomposer+dbpprop%3AbirthPlace+%3Fb_place++.%0D%0A++OPTIONAL+%7B+%3Fb_place+rdfs%3Alabel+%3Fbirth_place+%7D+.%0D%0A++FILTER+%28lang%28%3Fbio%29+%3D+%27en%27%29%0D%0A%7D&format=json"

    request(query, (err, res, body) => {
      if (err) { return console.log(err); }

      // JSON PARSING
      var json = JSON.parse(body)

      // RESPONSE
      var name = "";
      var bio = "";
      var birthPlace = "";
      var birthDate = "";
      var deathPlace = "";
      var deathDate = "";
      var image = ""

      var row = json["results"]["bindings"][0];
      name = row["name"]["value"];
      bio = row["bio"]["value"];
      if (row["birth_place"])
        birthPlace = row["birth_place"]["value"];
      birthDate = row["birth_date"]["value"];
      if (row["death_place"])
        deathPlace = row["death_place"]["value"];
      deathDate = row["death_date"]["value"];
      image = row["image"]["value"];
      
      // CREATE ATTACHMENT
      var attachment = getBioCard(name, birthPlace, birthDate, deathPlace, deathDate, image, bio)
      bot.reply(message, attachment);
    });
}

var getUriAndAnswerBio = function(sessionID, resolvedName, bot, message) {
  var request = require('request');
  var options = {
    method: 'GET',
    uri: 'https://api.dialogflow.com/v1/entities/ebf4cca4-ea6b-4e55-a901-03338ea5691e?sessionId=' + sessionID,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.dialogflow
    }
  };

  function callback(error, response, body) {

    // JSON PARSING
    var json = JSON.parse(body)
    var found = false

    // NO forEach CONSTRUCT, BECAUSE OF UNIQUENESS!
    for(var i = 0; i < json["entries"].length; i++) {
      var entry = json["entries"][i]      
      for(var j = 0; j < entry["synonyms"].length; j++) {
        if(entry["synonyms"][j] === resolvedName) {

          // GET PARAMETERS
          var artist = entry["value"];
          // var number = message.entities["number"];

          found = true;
          break;
        }
      }

      if (found) {
        answerBio(bot, message, artist);
        break;
      }
    }
  };

  request(options, callback)
}

var getUriAndQuery = function(sessionID, resolvedName, number, bot, message) {
  var request = require('request');
  var options = {
    method: 'GET',
    uri: 'https://api.dialogflow.com/v1/entities/ebf4cca4-ea6b-4e55-a901-03338ea5691e?sessionId=' + sessionID,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.dialogflow
    }
  };

  function callback(error, response, body) {

    // JSON PARSING
    var json = JSON.parse(body)
    var found = false

    // NO forEach CONSTRUCT, BECAUSE OF UNIQUENESS!
    for(var i = 0; i < json["entries"].length; i++) {
      var entry = json["entries"][i]      
      for(var j = 0; j < entry["synonyms"].length; j++) {
        if(entry["synonyms"][j] === resolvedName) {

          // GET PARAMETERS
          var artist = entry["value"];
          // var number = message.entities["number"];

          found = true;
          break;
        }
      }

      if (found) {
        doQuery(artist, number, bot, message);
        break;
      }
    }
  };

  request(options, callback)
}


// INITs
slackController.middleware.receive.use(dialogflowMiddleware.receive);
slackBot.startRTM();


// WORKS-BY-ARTIST INTENT
slackController.hears(['works-by-artist'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  // ACTION COMPLETE (the artist name has been provided)
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    // GET PARAMETERS
    var artist = message.entities["doremus-artist-ext"];
    var number = message.entities["number"];
    var instruments = message.entities["doremus-instrument"];
    var strictly = message.entities["doremus-strictly"];
    
    // CHECK IF INSTRUMENT IS PRESENT
    if (instruments && instruments.length > 0) {
      
      // DO THE QUERY (WITH ALL THE INFOS)
      doQuery(artist, number, instruments, strictly, bot, message);
    }
    else {
      
      // SEND THE BOT RESPONSE ("Do you want to filter by instruments?")
      bot.reply(message, message['fulfillment']['speech']);
    }
  }
  
  // ACTION INCOMPLETE (the artist names hasn't been provided or it was misspelled)
  else {
    
    // MISSING ARTIST NAME
    // -> check for misspelling and ask for the most similar (over threshold)
    // -> otherwise forward the question sent by DialogFlow ("For which artist?")
    
    // Retrieve the misspelled string
    var misspelled = message.entities["any"];
    
    // If contains something...
    if (misspelled != '') {
      
      // ...make prettier the Dialogflow response ("Who is the artist?")
      var response = "Sorry, I didn't found him! I give you some hints:\n";
      
      // ...get the 3 most similar artist names and propose them to the user
      var result = misspellingSolver.get(misspelled);
      for (var i = 0; i < 3 && i < result.length; i++)
          response += "- " + result[i][1] + "\n";
      
      response += "So, for which artist?";
      
      bot.reply(message, response);
    }
    // if the string doesn't contain anything, send the NLP question
    else {
      
      bot.reply(message, message['fulfillment']['speech']);
    }
  }
});

// WORKS-BY-ARTIST YES FOLLOW-UP
slackController.hears(['works-by-artist - yes'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  // IF YES HAS BEEN WRITTEN, WITH INSTRUMENTS PROVIDED
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    var parentContext = message["nlpResponse"]["result"]["contexts"][0]
    
    // GET PARAMETERS
    var artist = parentContext["parameters"]["doremus-artist-ext"];
    var number = parentContext["parameters"]["number"];
    var instrument = message.entities["doremus-instrument"];
    var strictly = message.entities["doremus-strictly"];
    
    // DO THE QUERY (WITH ALL THE INFOS)
    doQuery(artist, number, instrument, strictly, bot, message);
  }
  
  // IF YES HAS BEEN SAID, BUT NO INSTRUMENTS PROVIDED
  else {
      
      // SEND THE BOT RESPONSE ("Ok! For which instruments?")
      bot.reply(message, message['fulfillment']['speech']);
  }
});

// WORKS-BY-ARTIST NO FOLLOW-UP
slackController.hears(['works-by-artist - no'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  var parentContext = message["nlpResponse"]["result"]["contexts"][0]

  // GET PARAMETERS
  var artist = parentContext["parameters"]["doremus-artist-ext"];
  var number = parentContext["parameters"]["number"];

  // DO THE QUERY (WITH ALL THE INFOS EXCEPT INSTRUMENTS)
  doQuery(artist, number, null, "", bot, message);

});

// DISCOVER ARTIST
slackController.hears(['discover-artist'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  // ACTION COMPLETE (we have all the required infos)
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    // SEND THE BIO TO THE USER
    answerBio(bot, message, message.entities["doremus-artist-ext"]);
  }
  
  // ACTION INCOMPLETE (the artist names hasn't been provided or it was misspelled)
  else {
    
    // MISSING ARTIST NAME
    // -> check for misspelling and ask for the most similar (over threshold)
    // -> otherwise forward the question sent by DialogFlow ("For which artist?")
    
    // Retrieve the misspelled string
    var misspelled = message.entities["any"];
    
    // If contains something...
    if (misspelled != '') {
      
      // ...make prettier the Dialogflow response ("Who is the artist?")
      var response = "Sorry, I didn't found him! I give you some hints:\n";
      
      // ...get the 3 most similar artist names and propose them to the user
      var result = misspellingSolver.get(misspelled);
      for (var i = 0; i < 3 && i < result.length; i++)
          response += "- " + result[i][1] + "\n";
      
      response += "So, for which artist?";
      
      bot.reply(message, response);
    }
    // if the string doesn't contain anything, send the NLP question
    else {
      
      bot.reply(message, message['fulfillment']['speech']);
    }
  }
  
});

// WORKS-BY-DISCOVERED-ARTIST INTENT
slackController.hears(['works-by-discovered-artist'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
    // GET PARAMETERS
    var artist = message.entities["doremus-artist-ext"];
    var number = message.entities["number"];
    var instruments = message.entities["doremus-instrument"];
    var strictly = message.entities["doremus-strictly"];
  
    // CHECK IF INSTRUMENT IS PRESENT
    if (instruments && instruments.length > 0 ) {
      // DO THE QUERY (WITH ALL THE INFOS)
      doQuery(artist, number, instruments, strictly, bot, message);
    }
    else {
      // SEND THE BOT RESPONSE ("Do you want to filter by instruments?")
      bot.reply(message, message['fulfillment']['speech']);
    }
      
});

// WORKS-BY-DISCOVERED-ARTIST YES FOLLOW-UP
slackController.hears(['works-by-discovered-artist - yes'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  // IF YES HAS BEEN WRITTEN, WITH INSTRUMENTS PROVIDED
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    var parentContext = message["nlpResponse"]["result"]["contexts"][0]
    
    // GET PARAMETERS
    var artist = parentContext["parameters"]["doremus-artist-ext"];
    var number = parentContext["parameters"]["number"];
    var instrument = message.entities["doremus-instrument"];
    var strictly = message.entities["doremus-strictly"];
    
    // DO THE QUERY (WITH ALL THE INFOS)
    doQuery(artist, number, instrument, strictly, bot, message);
  }
  
  // IF YES HAS BEEN SAID, BUT NO INSTRUMENTS PROVIDED
  else {
      
      // SEND THE BOT RESPONSE ("Ok! For which instruments?")
      bot.reply(message, message['fulfillment']['speech']);
  }
});

// WORKS-BY-DISCOVERED-ARTIST NO FOLLOW-UP
slackController.hears(['works-by-discovered-artist - no'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  var parentContext = message["nlpResponse"]["result"]["contexts"][0]

  // GET PARAMETERS
  var artist = parentContext["parameters"]["doremus-artist-ext"];
  var number = parentContext["parameters"]["number"];

  // DO THE QUERY (WITH ALL THE INFOS EXCEPT INSTRUMENTS)
  doQuery(artist, number, null, "", bot, message);

});


// HELLO INTENT
slackController.hears(['hello-intent'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  bot.reply(message, message['fulfillment']['speech']);
});


// DEFAULT INTENT
slackController.hears(['Default Fallback Intent'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  bot.reply(message, message['fulfillment']['speech']);
});
