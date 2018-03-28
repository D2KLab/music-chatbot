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

var bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    debug: true,
    scopes: ['bot'],
    studio_token: process.env.studio_token,
    studio_command_uri: process.env.studio_command_uri
};

var slackController = Botkit.slackbot(bot_options);

var slackBot = slackController.spawn({
    token: process.env.token,
});

var dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    token: process.env.dialogflow,
});

slackController.middleware.receive.use(dialogflowMiddleware.receive);
slackBot.startRTM();

slackController.hears(['works-of-artist'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  // Take artist from Dialogflow
  var artist = message.entities.any;
  
  // Prepare the query
  var baseURI = "http://data.doremus.org/sparql?default-graph-uri=&query="
  //var query = "SELECT DISTINCT ?title WHERE { ?expression a efrbroo:F22_Self-Contained_Expression ; rdfs:label ?title . ?expCreation efrbroo:R17_created ?expression ; ecrm:P9_consists_of / ecrm:P14_carried_out_by ?composer . ?composer foaf:name \"" + artist + "\"} ORDER BY ?title LIMIT 10"
  
  var query = "SELECT DISTINCT ?title \
WHERE { \
  ?expression a efrbroo:F22_Self-Contained_Expression ; \
    rdfs:label ?title . \
  ?expCreation efrbroo:R17_created ?expression ; \
    ecrm:P9_consists_of / ecrm:P14_carried_out_by ?composer . \
  ?composer foaf:name \"" + artist + "\" \
} \
ORDER BY ?title \
LIMIT 10"
  var encodedQuery = baseURI + encodeURIComponent(query);
  console.log(encodedQuery)
  
  // HTTP request
  var querystring = require("querystring");
  const postData = querystring.stringify({
    'msg': baseURI + encodeURIComponent(query)
  });
  // console.log(postData)

  const options = {
    hostname: 'data.doremus.org',
    port: 80,
    path: '/sparql?default-graph-uri=&query=',
    method: 'GET'
  };
  
  var http = require("http");
  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    /*res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
      console.log('No more data in response.');
    });
  });

  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  // write data to request body
  req.write(postData);
  req.end();*/
  });
  
  //bot.reply(message, artist);
});

/* note this uses example middlewares defined above */
slackController.hears(['weather'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  console.log("***************");
  console.log(message.entities);
  console.log("----")
  console.log(message.fulfillment.displayText)
  console.log(message.nlpResponse)
  if (message.fulfillment.displayText)
    bot.reply(message, message.fulfillment.displayText);
});

slackController.hears(['hello-intent'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  bot.reply(message, "Hi there! I'm a weather expert");
});
