'use strict';


const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');

module.exports = function(port) {
    var server = express();

    server.use(bodyParser.urlencoded({
        extended: true
    }));

    server.use(bodyParser.json());

    server.post('/answers', (request, response) => {

        console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
        console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

        function doWorksByQuery(artist, number, instrument, strictly, yearstart, yearend, genre, platform) {
            // DEFAULT NUMBER VALUE (IN CASE IS NOT GIVEN)
            var num = 5;
            if (!isNaN(parseInt(number))) {
                num = parseInt(number);
            }

            // JSON QUERY  
            // -> Init query
            var newQuery = 'SELECT SAMPLE(?title) AS ?title, SAMPLE(?artist) AS ?artist, \
                  SAMPLE(?year) AS ?year, SAMPLE(?genre) AS ?genre, \
                  SAMPLE(?comment) AS ?comment, SAMPLE(?key) AS ?key \
                   WHERE { \
                     ?expression a efrbroo:F22_Self-Contained_Expression ; \
                       rdfs:label ?title ; \
                       rdfs:comment ?comment ; \
                       mus:U13_has_casting ?casting ; \
                       mus:U12_has_genre ?gen . \
                     ?expCreation efrbroo:R17_created ?expression ; \
                       ecrm:P4_has_time-span ?ts ; \
                       ecrm:P9_consists_of / ecrm:P14_carried_out_by ?composer . \
                     ?composer foaf:name ?artist . \
                     ?gen skos:prefLabel ?genre . \
                     OPTIONAL { \
                       ?ts time:hasEnd / time:inXSDDate ?comp . \
                       BIND (year(?comp) AS ?year) . \
                       ?expression mus:U11_has_key ?k . \
                       ?k skos:prefLabel ?key \
                     } . '

            console.log(genre);
            if (genre !== "") {
                newQuery += 'VALUES(?gen) { \
                   (<http://data.doremus.org/vocabulary/iaml/genre/' + genre + '>) \
                 }';
            }

            if (artist !== "") {
                newQuery += 'VALUES(?composer) { \
                   (<http://data.doremus.org/artist/' + artist + '>) \
                 }';
            }

            // -> Start year present
            if (yearstart != null && yearend != null) {
                newQuery += 'FILTER ( ?comp >= "' + yearstart + '"^^xsd:gYear AND ?comp <= "' + yearend + '"^^xsd:gYear ) .'
            } else if (yearstart != null && yearend == null) {
                newQuery += 'FILTER ( ?comp >= "' + yearstart + '"^^xsd:gYear ) .'
            } else if (yearstart == null && yearend != null) {
                newQuery += 'FILTER ( ?comp <= "' + yearend + '"^^xsd:gYear ) .'
            }

            // -> No instrument
            if (instrument.length == 0) {

                newQuery += '} \
                 GROUP BY ?expression \
                 ORDER BY rand() \
                 LIMIT ' + num
            }
            // -> Just one instrument
            else if (instrument.length == 1) {

                newQuery += '?casting mus:U23_has_casting_detail ?castingDetail . \
                 ?castingDetail mus:U2_foresees_use_of_medium_of_performance / skos:exactMatch* ?instrument . \
                 VALUES(?instrument) { \
                   (<http://data.doremus.org/vocabulary/iaml/mop/' + instrument + '>) \
                 } \
               } \
               GROUP BY ?expression \
               ORDER BY rand() \
               LIMIT ' + num
            }
            // -> List of instruments
            else {

                // AND case
                if (strictly === "and") {
                    for (var i = 0; i < instrument.length; i++) {
                        newQuery += '?casting mus:U23_has_casting_detail ?castingDetail' + i + ' . \
                     ?castingDetail' + i + ' mus:U2_foresees_use_of_medium_of_performance / skos:exactMatch* ?instrument' + i + ' . \
                     VALUES(?instrument' + i + ') { \
                       (<http://data.doremus.org/vocabulary/iaml/mop/' + instrument[i] + '>) \
                     }'
                    }

                    newQuery += '} \
                   GROUP BY ?expression \
                   ORDER BY rand() \
                   LIMIT ' + num
                }
                // OR case
                else {
                    newQuery += '?casting mus:U23_has_casting_detail ?castingDetail . \
                   ?castingDetail mus:U2_foresees_use_of_medium_of_performance / skos:exactMatch* ?instrument . \
                   VALUES(?instrument) {'

                    for (var i = 0; i < instrument.length; i++) {
                        newQuery += '(<http://data.doremus.org/vocabulary/iaml/mop/' + instrument[i] + '>)'
                    }

                    newQuery += '} \
                 } \
                 GROUP BY ?expression \
                 ORDER BY rand() \
                 LIMIT ' + num
                }
            }

            // -> Finalize the query
            var queryPrefix = 'http://data.doremus.org/sparql?default-graph-uri=&query=';
            var querySuffix = '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
            var finalQuery = queryPrefix + encodeURI(newQuery) + querySuffix;

            // -> Do the HTTP request
            const request = require('request');
            request(finalQuery, (err, res, body) => {

                if (err) {
                    return console.log(err);
                }

                // JSON PARSING
                var json = JSON.parse(body)

                // RESPONSE
                if (json["results"]["bindings"].length === 0) {

                    return response.json({
                        speech: "Sorry... I didn't find anything!",
                        displayText: "Sorry... I didn't find anything!"
                    })

                } else {

                    var workCard;

                    var speech = "No problem. I tell you some titles. ";
                    json["results"]["bindings"].forEach(function(row) {

                        var artist = row["artist"]["value"];
                        var title = row["title"]["value"];
                        var year = row["key"] !== undefined ? row["year"]["value"] : '-';
                        var genre = row["genre"]["value"];
                        var comment = row["comment"]["value"];
                        var key = row["key"] !== undefined ? row["key"]["value"] : '-';

                        speech += title + ". "
                    });

                    response.set('Content-Type', 'application/json');
                    return response.json({
                        speech: speech,
                        displayText: "This is the list:",
                    })
                }
            });
        }

        function showWorks(askForAdditionalFilters) {

            var parameters;
            var filterCounter = 0;
            // GET PARAMETERS
            if (askForAdditionalFilters) {
                parameters = request.body.result.parameters
                // COUNT OF THE FILTER SET BY THE USER
                for (var key in parameters) {
                    if (typeof parameters[key] === "string" && parameters[key] !== "") {
                        filterCounter++;
                    } else if (typeof parameters[key] !== "string" && parameters[key].length != 0) {
                        filterCounter++;
                    }
                }
            } else {
                parameters = request.body.result.contexts[0].parameters
            }

            if (filterCounter <= 2 && askForAdditionalFilters == true) {
                return response.json({
                    speech: "Uhm...you told me few filters. Do you want to add something?",
                    displayText: "Uhm...you told me few filters. Do you want to add something?"
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
                doWorksByQuery(parameters["doremus-artist"], parameters.number, parameters["doremus-instrument"],
                    parameters["doremus-strictly"], startyear, endyear, parameters["doremus-genre"]);
            }
        }

        // Run the proper function handler based on the matched Dialogflow intent name
        var intent = request.body.result.metadata.intentName;
        if (intent === "works-by") {
            showWorks(true)
        } else if (intent == "works-by - no") {
            showWorks(false)
        }
    });

    server.listen(port, () => {
        console.log("Dialogflow webhook server running on port " + port);
    });
}