/* WEBHOOK IO */

var functions = require("./functions.js");
var botVars = require("../bot.js");
var log = botVars.log;

// SHOW WORKS ACTION
module.exports.showWorks = function showWorks(request, response, askForAdditionalFilters) {

    var parameters;
    var filterCounter = 0;

    // GET PARAMETERS
    if (askForAdditionalFilters) {
        parameters = request.body.result.parameters;

        // COUNT OF THE FILTER SET BY THE USER
        for (var key in parameters) {
            if (typeof parameters[key] === "string" && parameters[key] !== "") {
                filterCounter++;
            } else if (typeof parameters[key] !== "string" && parameters[key].length != 0) {
                filterCounter++;
            }
        }
    } else {

        var contexts = request.body.result.contexts;
        
        for (var i = 0; i < contexts.length; i++) {
            if (contexts[i].name === "works-by-followup") {
                
                parameters = contexts[i].parameters;
                break;
            }
        }
    }

    if (filterCounter <= 2 && askForAdditionalFilters == true) {
        
        const speech = "Uhm... sure! Do you want to add some filters? Like the artist, instruments, genre or composition period.";
        const message = request.body.result.resolvedQuery;
        const lang = request.body.lang.slice(0,2);
        const confidence = request.body.result.score;

        log.write("google_assistant", "-", "-", "works-by",
            '"' + speech + '"', '"' + message + '"',
            '"' + message + '"', lang, confidence);
        return response.json({
            speech: speech,
            displayText: speech,
        })
    } else {

        // YEAR CHECK AND PARSING
        var startyear = null;
        var endyear = null;

        if (parameters["date-period"] !== "") {
            startyear = parseInt(parameters["date-period"].split("/")[0]);
            endyear = parseInt(parameters["date-period"].split("/")[1]);

            // SWAP IF PROVIDED IN THE INVERSE ORDER
            if (startyear > endyear) {
                var tmp = startyear;
                startyear = endyear;
                endyear = tmp;
            }
        }

        // ARTIST PARSING
        if (parameters["doremus-artist"] == "" && parameters["doremus-artist-prev"] !== "") {
            parameters["doremus-artist"] = parameters["doremus-artist-prev"];
        }

        // DO THE QUERY (WITH ALL THE INFOS)
        functions.doWorksByQuery(request, response, parameters["doremus-artist"],
            parameters.number, parameters["doremus-instrument"],
            parameters["doremus-strictly"],
            startyear,
            endyear,
            parameters["doremus-genre"]);
    }
}


// SHOW PERFORMANCES ACTION
module.exports.showPerformances = function showPerformances(request, response) {

    // ACTION COMPLETE (the date has been provided)
    if (request.body.result['actionIncomplete'] === false) {

        var date = request.body.result.parameters["date-period"];
        var place = request.body.result.parameters["geo-city"];
        var number = request.body.result.parameters["number"];

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
        functions.doQueryPerformance(request, response, num, city, startdate, enddate);
    }

    // ACTION INCOMPLETE (missing date)
    else {

        const speech = "Sure! In which period?";
        const message = request.body.result.resolvedQuery;
        const lang = request.body.lang.slice(0,2);
        const confidence = request.body.result.score;

        log.write("google_assistant", "-", "-", "find-performance",
            '"' + speech + '"', '"' + message + '"',
            '"' + message + '"', lang, confidence);
        return response.json({
            speech: speech,
            displayText: speech,
        })
    }
}