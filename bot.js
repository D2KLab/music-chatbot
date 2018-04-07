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


// FUNCTION TO CLEAR THE ACTIVE CONTEXT
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
      console.log(body);
      console.log(response);
    }
  }
  request(options, callback)
}


// VARIABLES DECLARATION
var Botkit = require('botkit');
var FuzzySet = require('fuzzyset.js')
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
var mispellingSolver = FuzzySet();
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('names.txt')
});
lineReader.on('line', function (line) {
  mispellingSolver.add(line);
});


// INITs
slackController.middleware.receive.use(dialogflowMiddleware.receive);
slackBot.startRTM();


// WORKS-BY-ARTIST INTENT
slackController.hears(['works-by-artist'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    // GET PARAMETERS
    var artist = message.entities["doremus-artist-ext"];
    var number = message.entities["number"];
    
    // DEFAULT NUMBER VALUE (IN CASE IS NOT GIVEN)
    if (isNaN(parseInt(number))) {
      number = 10;
    }

    // JSON VERSION
    var jsonQueryOLD = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Ftitle%0D%0AWHERE+%7B%0D%0A++%3Fexpression+a+efrbroo%3AF22_Self-Contained_Expression+%3B%0D%0A++++rdfs%3Alabel+%3Ftitle+.%0D%0A++%3FexpCreation+efrbroo%3AR17_created+%3Fexpression+%3B%0D%0A++++ecrm%3AP9_consists_of+%2F+ecrm%3AP14_carried_out_by+%3Fcomposer+.%0D%0A++%3Fcomposer+foaf%3Aname+%22" + artist + "%22%0D%0A%7D%0D%0AORDER+BY+rand%28%29%0D%0ALIMIT+" + number + "%0D%0A&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on"
    var jsonQuery = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Ftitle%0D%0AWHERE+%7B%0D%0A++%3Fexpression+a+efrbroo%3AF22_Self-Contained_Expression+%3B%0D%0A++++rdfs%3Alabel+%3Ftitle+.%0D%0A++%3FexpCreation+efrbroo%3AR17_created+%3Fexpression+%3B%0D%0A++++ecrm%3AP9_consists_of+%2F+ecrm%3AP14_carried_out_by+%3Fcomposer%0D%0A++VALUES+%28%3Fcomposer%29+%7B%0D%0A++++%28%3Chttp%3A%2F%2Fdata.doremus.org%2Fartist%2F" + artist + "%3E%29%0D%0A++%7D%0D%0A%0D%0A%7D%0D%0AORDER+BY+rand%28%29%0D%0ALIMIT+" + number + "%0D%0A&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on";

    const request = require('request');
    request(jsonQuery, (err, res, body) => {

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
  else { // actionIncomplete == true
    
    // MISSING ARTIST NAME
    // - check for misspelling and ask for the most similar (over threshold)
    // - otherwise forward the question sent by Dialogflow ("for which artist?")
    
    // Retrieve the mispelled string
    var misspelled = message.entities["any"];
    
    // If contains something...
    if (misspelled != '') {
      
      // Try to solve it and propose the alternatives,
      // otherwise send the NLP question
      var result = mispellingSolver.get(misspelled);
      if (result != null) {
        
        /********************************/
        if (message.entities["yes-no"] === "yes") {
          
          sendClearContext(message['nlpResponse']['sessionId']);

          // GET PARAMETERS
          var artist = message.entities["doremus-artist-ext"]; ////////////////////// BUG
          var number = message.entities["number"];

          // DEFAULT NUMBER VALUE (IN CASE IS NOT GIVEN)
          if (isNaN(parseInt(number))) {
            number = 10;
          }

          // JSON VERSION
          var jsonQuery = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Ftitle%0D%0AWHERE+%7B%0D%0A++%3Fexpression+a+efrbroo%3AF22_Self-Contained_Expression+%3B%0D%0A++++rdfs%3Alabel+%3Ftitle+.%0D%0A++%3FexpCreation+efrbroo%3AR17_created+%3Fexpression+%3B%0D%0A++++ecrm%3AP9_consists_of+%2F+ecrm%3AP14_carried_out_by+%3Fcomposer+.%0D%0A++%3Fcomposer+foaf%3Aname+%22" + artist + "%22%0D%0A%7D%0D%0AORDER+BY+rand%28%29%0D%0ALIMIT+" + number + "%0D%0A&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on"
          var jsonQuery = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Ftitle%0D%0AWHERE+%7B%0D%0A++%3Fexpression+a+efrbroo%3AF22_Self-Contained_Expression+%3B%0D%0A++++rdfs%3Alabel+%3Ftitle+.%0D%0A++%3FexpCreation+efrbroo%3AR17_created+%3Fexpression+%3B%0D%0A++++ecrm%3AP9_consists_of+%2F+ecrm%3AP14_carried_out_by+%3Fcomposer%0D%0A++VALUES+%28%3Fcomposer%29+%7B%0D%0A++++%28%3Chttp%3A%2F%2Fdata.doremus.org%2Fartist%2F" + artist + "%3E%29%0D%0A++%7D%0D%0A%0D%0A%7D%0D%0AORDER+BY+rand%28%29%0D%0ALIMIT+" + number + "%0D%0A&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on";

          const request = require('request');
          request(jsonQuery, (err, res, body) => {

            if (err) { return console.log(err); }

            // JSON PARSING
            var json = JSON.parse(body)

            // RESPONSE
            var resp = "This is the list:\n";
            json["results"]["bindings"].forEach(function(row) {
              resp += ("  >  " + row["title"]["value"] + "\n");
            });
            bot.reply(message, resp);
            
            sendClearContext(message['nlpResponse']['sessionId']);
          });
        }
        else if ((message["text"] === "no")) {

          bot.reply(message, "Ok, sorry for that! Retry if you want...");
          sendClearContext(message['nlpResponse']['sessionId']);
        }
        else {
          var answer = "Did you mean " + result[0][1] + "?"
          bot.reply(message, answer);

          // We must clear the context
          // sendClearContext(message['nlpResponse']['sessionId']);
        }
        /**********************/
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