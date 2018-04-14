/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
This is a sample Slack bot built with Botkit, using the Dialogflow middleware.
This bot demonstrates many of the core features of Botkit:
* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
# RUN THE BOT:
  Get a Bot token from Slack:
    -> http://my.slack.com/services/new/bot
  Get a developer access token from dialogflow
    -> https://console.dialogflow.com/api-client/#/editAgent/<your-agent-id>
  Run your bot from the command line:
    dialogflow=<api-token> token=<token> node example_bot.js
# USE THE BOT:
  Train an intent titled "hello-intent" inside Dialogflow.  Give it a bunch of examples
  of how someone might say "Hello" to your bot.
  Find your bot inside Slack to send it a direct message.
  Say: "Hello"
  The bot should reply "Hello!" If it didn't, your intent hasn't been
  properly trained - check out the dialogflow console!
  Make sure to invite your bot into other channels using /invite @<my bot>!
# EXTEND THE BOT:
  Botkit is has many features for building cool and useful bots!
  Read all about it here:
    -> http://howdy.ai/botkit
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

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

var iter = 0;
var misspelledStack = [];
var intentThrowsMisspelled = "";
var oldNumber = 10;

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
  var bioAttachment = {
    "attachments": [
          {
        "pretext": "This is what I found:",
              "fallback": "ReferenceError - UI is not defined: https://honeybadger.io/path/to/event/",
              "title" : fullname,
        "image_url": imageURL,
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
          }
      ]
  }
  return bioAttachment;
}

function doQuery(artist, number, instrument, bot, message) {
  // DEFAULT NUMBER VALUE (IN CASE IS NOT GIVEN)
  if (isNaN(parseInt(number))) {
    number = 10;
  }

  // JSON VERSION
  var jsonQuery = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Ftitle%0D%0AWHERE+%7B%0D%0A++%3Fexpression+a+efrbroo%3AF22_Self-Contained_Expression+%3B%0D%0A++++rdfs%3Alabel+%3Ftitle+.%0D%0A++%3FexpCreation+efrbroo%3AR17_created+%3Fexpression+%3B%0D%0A++++ecrm%3AP9_consists_of+%2F+ecrm%3AP14_carried_out_by+%3Fcomposer%0D%0A++VALUES+%28%3Fcomposer%29+%7B%0D%0A++++%28%3Chttp%3A%2F%2Fdata.doremus.org%2Fartist%2F" + artist + "%3E%29%0D%0A++%7D%0D%0A%0D%0A%7D%0D%0AORDER+BY+rand%28%29%0D%0ALIMIT+" + number + "%0D%0A&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on";
  var instrQuery = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Ftitle%0D%0AWHERE+%7B%0D%0A++%3Fexpression+a+efrbroo%3AF22_Self-Contained_Expression+%3B%0D%0A++++rdfs%3Alabel+%3Ftitle+%3B%0D%0A++++mus%3AU13_has_casting+%3Fcasting+.%0D%0A%0D%0A++%3FexpCreation+efrbroo%3AR17_created+%3Fexpression+%3B%0D%0A++++ecrm%3AP9_consists_of+%2F+ecrm%3AP14_carried_out_by+%3Fcomposer+.%0D%0A%0D%0A++%3Fcasting+mus%3AU23_has_casting_detail+%3FcastingDetail+.%0D%0A%0D%0A++%3FcastingDetail+mus%3AU2_foresees_use_of_medium_of_performance+%3Finstrument+.%0D%0A%0D%0A++VALUES%28%3Fcomposer%29+%7B%0D%0A++++%28%3Chttp%3A%2F%2Fdata.doremus.org%2Fartist%2F" + artist + "%3E%29%0D%0A++%7D%0D%0A++%0D%0A++VALUES%28%3Finstrument%29+%7B%0D%0A++++%28%3Chttp%3A%2F%2Fdata.doremus.org%2Fvocabulary%2Fiaml%2Fmop%2F" + instrument + "%3E%29%0D%0A++%7D%0D%0A%7D%0D%0AORDER+BY+rand%28%29%0D%0ALIMIT+" + number + "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on"  
  var query = ""
  
  if (instrument == "") {
    query = jsonQuery;
  }
  else {
    query = instrQuery;
  }
  
  console.log(instrument)
  
  const request = require('request');
  request(query, (err, res, body) => {

    if (err) { return console.log(err); }

    // JSON PARSING
    var json = JSON.parse(body)

    // RESPONSE
    var resp = "This is the list:\n";
    json["results"]["bindings"].forEach(function(row) {
      resp += ("  >  " + row["title"]["value"] + "\n");
    });
    
    bot.reply(message, resp);

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
  
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    // GET PARAMETERS
    var artist = message.entities["doremus-artist-ext"];
    var number = message.entities["number"];
    var instrument = message.entities["doremus-instrument"];
    
    // CHECK IF INSTRUMENT IS PRESENT
    if (instrument != "") {
      
      // DO THE QUERY (WITH ALL THE INFOS)
      doQuery(artist, number, instrument, bot, message);
    }
    else {
      
      // SEND THE BOT RESPONSE ("Do you want to filter by instruments?")
      bot.reply(message, message['fulfillment']['speech']);
    }
    
    misspelledStack = [];
    oldNumber = message.entities["number"];
    // (sendClearContext(message['nlpResponse']['sessionId']);
    iter = 0;
  }
  else {
    
    // MISSING ARTIST NAME
    // - check for misspelling and ask for the most similar (over threshold)
    // - otherwise forward the question sent by DialogFlow ("for which artist?")
    
    // Retrieve the misspelled string
    var misspelled = message.entities["any"];
    
    // If contains something...
    if (misspelled != '') {
      
      // Try to solve it and propose the alternatives,
      // otherwise send the NLP question
      var result = misspellingSolver.get(misspelled);
      if (result != null) {
        
        for (var i = 0; i < 3 && i < result.length; i++)
          misspelledStack[i] = result[i][1];
        
        // We must clear the context
        oldNumber = message.entities["number"];
        intentThrowsMisspelled = "works-by-artist";
        sendClearContext(message['nlpResponse']['sessionId']);
        iter = 0;
        
        bot.reply(message, "Did you mean " + misspelledStack[iter]+ "?");
      }
      else {
        bot.reply(message, message['fulfillment']['speech']);
      }
    }
    // if the string doesn't contain anything, send the NLP question
    else {
      
      bot.reply(message, message['fulfillment']['speech']);
    }
  }
});

slackController.hears(['works-by-artist - yes'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    var parentContext = message["nlpResponse"]["result"]["contexts"][0]
    
    // GET PARAMETERS
    var artist = parentContext["parameters"]["doremus-artist-ext"];
    var number = parentContext["parameters"]["number"];
    var instrument = message.entities["doremus-instrument"];
    
    // DO THE QUERY (WITH ALL THE INFOS)
    doQuery(artist, number, instrument, bot, message);
  }
  else {
      
      // SEND THE BOT RESPONSE ("Do you want to filter by instruments?")
      bot.reply(message, message['fulfillment']['speech']);
  }
});

slackController.hears(['works-by-artist - no'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  var parentContext = message["nlpResponse"]["result"]["contexts"][0]

  // GET PARAMETERS
  var artist = parentContext["parameters"]["doremus-artist-ext"];
  var number = parentContext["parameters"]["number"];

  // DO THE QUERY (WITH ALL THE INFOS)
  doQuery(artist, number, "", bot, message);

});

// YES (CONFIRM) INTENT
slackController.hears(['confirm'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  console.log(misspelledStack)
  if (misspelledStack.length > 0) {
    
    if (intentThrowsMisspelled == "works-by-artist") {
    
      getUriAndQuery(message['nlpResponse']['sessionId'], misspelledStack[iter], oldNumber, bot, message);

      // We must clear the context
      sendClearContext(message['nlpResponse']['sessionId']);
      iter = 0;
      misspelledStack = [];
      oldNumber = 10;
      
    } else if (intentThrowsMisspelled == "discover-artist") {

      getUriAndAnswerBio(message['nlpResponse']['sessionId'], misspelledStack[iter], bot, message);
      
      // We must clear the context
      sendClearContext(message['nlpResponse']['sessionId']);
      iter = 0;
      misspelledStack = [];
    }
  }
  else {
    bot.reply(message, message['fulfillment']['speech']);
  }

});

// NO FOLLOW-UP INTENT
slackController.hears(['decline'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  if (misspelledStack.length > 0) {
    
    if (iter < 2 && iter < misspelledStack.length) {

      iter += 1
      bot.reply(message, "Did you mean " + misspelledStack[iter] + "?");
    }
    else {

      bot.reply(message, "Ok, sorry for that!");

      // We must clear the context
      sendClearContext(message['nlpResponse']['sessionId']);
      iter = 0;
      misspelledStack = [];
      oldNumber = 10;
    }
  }
  else {
    
    bot.reply(message, message['fulfillment']['speech']);
  }

});


// DISCOVER ARTIST
slackController.hears(['discover-artist'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    answerBio(bot, message, message.entities["doremus-artist-ext"]);
    
  } else {
    var misspelled = message.entities["any"];
    
    // If contains something...
    if (misspelled != '') {
      
      // Try to solve it and propose the alternatives,
      // otherwise send the NLP question
      var result = misspellingSolver.get(misspelled);
      if (result != null) {
        
        for (var i = 0; i < 3 && i < result.length; i++)
          misspelledStack[i] = result[i][1];
        
        // We must clear the context
        intentThrowsMisspelled = "discover-artist";
        sendClearContext(message['nlpResponse']['sessionId']);
        iter = 0;
        
        bot.reply(message, "Did you mean " + misspelledStack[iter]+ "?");
      }
      else {
        bot.reply(message, message['fulfillment']['speech']);
      }
    }
    // if the string doesn't contain anything, send the NLP question
    else {
      bot.reply(message, message['fulfillment']['speech']);
    }
  }
  
});


// HELLO INTENT
slackController.hears(['hello-intent'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  console.log(message);
  bot.reply(message, message['fulfillment']['speech']);
});


// DEFAULT INTENT
slackController.hears(['Default Fallback Intent'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  bot.reply(message, message['fulfillment']['speech']);
});

// NEW INTENT