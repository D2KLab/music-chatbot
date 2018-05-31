'use strict';

// REQUIREMENTS
const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
var io = require("./io.js");


module.exports = function(port) {

    var server = express();

    // INIT
    server.use(bodyParser.urlencoded({
        extended: true
    }));
    server.use(bodyParser.json());

    // SERVER POST ACTIONS
    server.post('/answers', (request, response) => {

        console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
        console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

        // Run the proper function handler based on the matched Dialogflow intent name
        var intent = request.body.result.metadata.intentName;
        if (intent === "works-by") {
            io.showWorks(request, response, true);
        } else if (intent === "works-by - no") {
            io.showWorks(request, response, false);
        } else if (intent === "find-performance") {
            io.showPerformances(request, response);
        }
    });

    // LISTEN
    server.listen(port, () => {
        console.log("info: ** Dialogflow webhook server running on port " + port);
    });

}