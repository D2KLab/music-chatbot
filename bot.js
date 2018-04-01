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


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

if (!process.env.dialogflow) {
    console.log('Error: Specify dialogflow in environment');
    process.exit(1);
}

var Botkit = require('botkit');
var FuzzySet = require('fuzzyset.js')
var http = require('http');

var bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    debug: true,
    scopes: ['bot'],
};


var slackController = Botkit.slackbot(bot_options);

var slackBot = slackController.spawn({
    token: process.env.token,
});

var dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    token: process.env.dialogflow,
});

slackController.middleware.receive.use(dialogflowMiddleware.receive);

slackBot.startRTM()

var sendClearContext = function(sessionID) {
  var request = require('request');
  console.log("---" + sessionID);
  var options = {
    method: 'DELETE',
    uri: 'https://api.dialogflow.com/v1/contexts/sessionId=' + sessionID,
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

var sendClearContext2 = function(sessionID) {

  var req = require('request')
  
  req({
    method: 'DELETE',
    uri: 'https://api.dialogflow.com/v1/contexts/sessionId=' + sessionID,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.dialogflow
    }
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      console.log(response);
    }
  });
  
}

var mispellingSolver = FuzzySet();

var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('names.txt')
});

lineReader.on('line', function (line) {
  mispellingSolver.add(line);
});

slackController.hears(['works-by-artist'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  if (message['nlpResponse']['result']['actionIncomplete'] == false) {
    
    // GET PARAMETERS
    var artist = message.entities["doremus-artist"];
    var number = message.entities["number"];
    
    // DEFAULT NUMBER VALUE (IN CASE IS NOT GIVEN)
    if (isNaN(parseInt(number))) {
      number = 10
    }

    // JSON VERSION
    var jsonQuery = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Ftitle%0D%0AWHERE+%7B%0D%0A++%3Fexpression+a+efrbroo%3AF22_Self-Contained_Expression+%3B%0D%0A++++rdfs%3Alabel+%3Ftitle+.%0D%0A++%3FexpCreation+efrbroo%3AR17_created+%3Fexpression+%3B%0D%0A++++ecrm%3AP9_consists_of+%2F+ecrm%3AP14_carried_out_by+%3Fcomposer+.%0D%0A++%3Fcomposer+foaf%3Aname+%22" + artist + "%22%0D%0A%7D%0D%0AORDER+BY+rand%28%29%0D%0ALIMIT+" + number + "%0D%0A&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on"
    const request = require('request');
    request(jsonQuery, (err, res, body) => {

      if (err) { return console.log(err); }

      // JSON PARSING
      console.log(body)
      var json = JSON.parse(body)

      // RESPONSE
      var resp = "This is the list:\n";
      json["results"]["bindings"].forEach(function(row) {
        resp += ("  >  " + row["title"]["value"] + "\n");
      });
      bot.reply(message, resp);
    });
  } else {
    // missing artist name
    // check for mispelling and ask for the most similar (over threshold)
    // otherwise forward the question sent by DialogFlow
    var mispelled = message.entities["any"];
    if (mispelled != '') {
      var result = mispellingSolver.get(mispelled);
      if (result != null) {
        bot.reply(message, "I'm sorry, I can't find your artist. Try with '" + result[0][1] + "'.");
        // we must clear the context
        sendClearContext2(message['nlpResponse']['sessionId']);
        console.log("----------------------------------")
        console.log(message['nlpResponse']['result']['contexts']);  
        console.log(message['nlpResponse']['sessionId'])
        console.log("##################################")
      } else {
        bot.reply(message, message['fulfillment']['speech']);
      }
    } else {
      bot.reply(message, message['fulfillment']['speech']);
    }
  }
});


slackController.hears(['hello-intent'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  bot.reply(message, "Hi there! I'm a classical music expert :D");
});

slackController.hears(['Default Fallback Intent'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  bot.reply(message, message['fulfillment']['speech']);
});