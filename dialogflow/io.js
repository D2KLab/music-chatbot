/* WEBHOOK IO */

var functions = require("./functions.js");

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
        var contexts = request.body.result.contexts
        console.log("*** Retrieving an old context...");
        //var context = contexts.filter( context => context["name"] == "works-by-followup");
        for (var i = 0; i < contexts.length; i++) {
            if (contexts[i].name === "works-by-followup") {
                console.log("I found the context");
                console.log(contexts[i]);
                parameters = contexts[i].parameters;
                break;
            }
        }
    }

    if (filterCounter <= 2 && askForAdditionalFilters == true) {
        return response.json({
            speech: "Uhm... you told me few filters. Do you want to add something?",
            displayText: "Uhm... you told me few filters. Do you want to add something?"
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
        functions.doWorksByQuery(response, parameters["doremus-artist"],
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
        functions.doQueryPerformance(response, num, city, startdate, enddate);
    }

    // ACTION INCOMPLETE (missing date)
    else {

        return response.json({
            speech: "Sure! In which period?",
            displayText: "Sure! In which period?"
        })
    }
}