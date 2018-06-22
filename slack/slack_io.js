/* SLACK HEARS */

var botVars = require("../bot.js");
var spellCheckerMiddleware = botVars.spellCheckerMiddleware;
var botFunctions = require("../doremus/bot_functions.js");

var log = botVars.log;

// WORKS-BY INTENT
module.exports.worksBy = botVars.slackController.hears(['works-by'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {

    if (message.text !== message.old) {
        
        var understoodText = (spellCheckerMiddleware.currentLang() === "en") ? "I understood: " : "J'ai compris: ";

        bot.reply(message, {
            "attachments": [{
                text: understoodText + message["text"],
                color: "warning"
            }]
        });
    }

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
        } else if (typeof parameters[key] !== "string" && parameters[key].length != 0) {
            filterCounter++;
        }
    }

    // CHECK IF THE MAX AMOUNT OF FILTERS IS APPLIED
    if (filterCounter > 2) {

        // YEAR CHECK AND PARSING
        var startyear = null;
        var endyear = null;
        
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
            parameters.strictly, startyear, endyear, parameters.genre, "slack", bot, message);
        log.write(bot.type, message.user, message.channel, "works-by",
            "<result_card>", '"' + message.text + '"',
            '"' + message.old + '"', message.lang, message.confidence);
    } else {

        bot.reply(message, message['fulfillment']['speech']);
        log.write(bot.type, message.user, message.channel, "works-by",
            '"' + message['fulfillment']['speech'] + '"',
            '"' + message.text + '"', '"' + message.old + '"',
            message.lang, message.confidence);
    }

});

// WORKS-BY - YES INTENT
module.exports.worksByYes = botVars.slackController.hears(['works-by - yes'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {

    bot.reply(message, message['fulfillment']['speech']);
    log.write(bot.type, message.user, message.channel, "works-by - yes",
        '"' + message['fulfillment']['speech'] + '"',
        '"' + message.text + '"', '"' + message.old + '"',
        message.lang, message.confidence);
});

// WORKS-BY - NO
module.exports.worksByNo = botVars.slackController.hears(['works-by - no'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {

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
    botFunctions.doQuery(artist, number, instruments, strictly, startyear, endyear, genre, "slack", bot, message);
    log.write(bot.type, message.user, message.channel, "works-by - no",
        "<result_card>", '"' + message.text + '"',
        '"' + message.old + '"', message.lang, message.confidence);
});


// WORKS-BY-SOMETHING INTENT
module.exports.worksBySomething = botVars.slackController.hears(['works-by-artist', 'works-by-instrument', 'works-by-genre', 'works-by-years'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {

    bot.reply(message, message['fulfillment']['speech']);
    log.write(bot.type, message.user, message.channel, "works-by-something",
        '"' + message['fulfillment']['speech'] + '"',
        '"' + message.text + '"', '"' + message.old + '"',
        message.lang, message.confidence);
});


// DISCOVER ARTIST
module.exports.findArtist = botVars.slackController.hears(['find-artist'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {

    if (message.text !== message.old) {

        var understoodText = (spellCheckerMiddleware.currentLang() === "en") ? "I understood: " : "J'ai compris: ";

        bot.reply(message, {
            "attachments": [{
                text: understoodText + message["text"],
                color: "warning"
            }]
        });
    }

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

    var num = 1;
    if (number !== "") {
        num = parseInt(number);
    }

    var city = "";
    if (place !== "") {
        city = place.toLowerCase();
    }

    // SEND THE BIO TO THE USER
    botFunctions.doQueryFindArtist(num, startdate, enddate, city, instrument, genre, "slack", bot, message);
    log.write(bot.type, message.user, message.channel, "find-artist",
        "<result_card>", '"' + message.text + '"',
        '"' + message.old + '"', message.lang, message.confidence);
});


// DISCOVER ARTIST
module.exports.discoverArtist = botVars.slackController.hears(['discover-artist'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {

    if (message.text !== message.old) {

        var understoodText = (spellCheckerMiddleware.currentLang() === "en") ? "I understood: " : "J'ai compris: ";

        bot.reply(message, {
            "attachments": [{
                text: understoodText + message["text"],
                color: "warning"
            }]
        });
    }

    // ACTION COMPLETE (we have all the required infos)
    if (message['nlpResponse']['result']['actionIncomplete'] == false) {

        // SEND THE BIO TO THE USER
        botFunctions.answerBio(message.entities["doremus-artist"], "slack", bot, message);
        log.write(bot.type, message.user, message.channel, "discover-artist",
            "<result_card>", '"' + message.text + '"',
            '"' + message.old + '"', message.lang, message.confidence);
    }

    // ACTION INCOMPLETE (the artist names hasn't been provided or it was misspelled)
    else {

        bot.reply(message, message['fulfillment']['speech']);
        log.write(bot.type, message.user, message.channel, "discover-artist",
            '"' + message['fulfillment']['speech'] + '"',
            '"' + message.text + '"', '"' + message.old + '"',
            message.lang, message.confidence);
    }

});


// FIND-PERFORMANCE
module.exports.findPerformance = botVars.slackController.hears(['find-performance'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {

    if (message.text !== message.old) {

        var understoodText = (spellCheckerMiddleware.currentLang() === "en") ? "I understood: " : "J'ai compris: ";

        bot.reply(message, {
            "attachments": [{
                text: understoodText + message["text"],
                color: "warning"
            }]
        });
    }

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
        botFunctions.doQueryPerformance(num, city, startdate, enddate, "slack", bot, message);
        log.write(bot.type, message.user, message.channel, "find-performance",
            "<result_card>", '"' + message.text + '"',
            '"' + message.old + '"', message.lang, message.confidence);
    }

    // ACTION INCOMPLETE (missing date)
    else {

        bot.reply(message, message['fulfillment']['speech']);
        log.write(bot.type, message.user, message.channel, "find-performance",
            '"' + message['fulfillment']['speech'] + '"',
            '"' + message.text + '"', '"' + message.old + '"',
            message.lang, message.confidence);
    }
});


// HELLO INTENT
module.exports.hello = botVars.slackController.hears(['hello'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {

    // Clear the context
    botFunctions.sendClearContext(message.nlpResponse.sessionId);

    bot.reply(message, message['fulfillment']['speech']);
    log.write(bot.type, message.user, message.channel, "hello",
        '"' + message['fulfillment']['speech'] + '"',
        '"' + message.text + '"',
        '"' + message.old + '"', message.lang, message.confidence);
});


// DEFAULT INTENT
module.exports.default = botVars.slackController.hears(['Default Fallback Intent'], 'direct_message, direct_mention, mention', botVars.dialogflowMiddleware.hears, function(bot, message) {

    bot.reply(message, message['fulfillment']['speech']);
});