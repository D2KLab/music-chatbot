/* WEBHOOK DOREMUS FUNCTIONS */

// DO QUERY WORKS-BY
module.exports.doWorksByQuery = function doWorksByQuery(response, artist, number, instrument, strictly, yearstart, yearend, genre) {

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

            var speech = "Yes! I tell you some titles. ...";
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


// DO QUERY FIND-PERFORMANCE
module.exports.doQueryPerformance = function doQueryPerformance(response, number, city, startdate, enddate) {

    // JSON QUERY  
    var newQuery = 'SELECT SAMPLE(?title) AS ?title, SAMPLE(?subtitle) AS ?subtitle, \
                    SAMPLE(?actorsName) AS ?actorsName, SAMPLE(?placeName) AS ?placeName, SAMPLE(?date) AS ?date \
                  WHERE { \
                    ?performance a mus:M26_Foreseen_Performance ; \
                      ecrm:P102_has_title ?title ; \
                      ecrm:P69_has_association_with / mus:U6_foresees_actor ?actors ; \
                      mus:U67_has_subtitle ?subtitle ; \
                      mus:U7_foresees_place_at / ecrm:P89_falls_within* ?place ; \
                      mus:U8_foresees_time_span ?ts . \
                    ?place rdfs:label ?placeName . \
                    ?actors rdfs:label ?actorsName . \
                    ?ts time:hasBeginning / time:inXSDDate ?time ; \
                       rdfs:label ?date . \
                    FILTER ( ?time >= "' + startdate + '"^^xsd:date AND ?time <= "' + enddate + '"^^xsd:date ) .'

    if (city !== "") {
        newQuery += 'FILTER ( contains(lcase(str(?placeName)), "' + city + '") )'
    }

    newQuery += '} \
               GROUP BY ?performance \
               ORDER BY rand() \
               LIMIT ' + number

    // -> Finalize the query
    var queryPrefix = 'http://data.doremus.org/sparql?default-graph-uri=&query='
    var querySuffix = '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
    var finalQuery = queryPrefix + encodeURI(newQuery) + querySuffix

    // -> Do the HTTP request
    const request = require('request');
    request(finalQuery, (err, res, body) => {

        if (err) {
            return console.log(err);
        }

        // JSON PARSING
        var json = JSON.parse(body);

        // RESPONSE
        if (json["results"]["bindings"].length === 0) {

            return response.json({
                speech: "Sorry... I didn't find anything!",
                displayText: "Sorry... I didn't find anything!"
            })
        } else {

            var speech = "Yes! ...";


            json["results"]["bindings"].forEach(function(row) {
                var title = row["title"]["value"];
                var subtitle = row["subtitle"]["value"];
                var placeName = row["placeName"]["value"];
                var actorsName = row["actorsName"]["value"];
                var date = row["date"]["value"];

                speech += title + ", at " + placeName + ". ";
            });

            response.set('Content-Type', 'application/json');
            return response.json({
                speech: speech,
                displayText: "This is the list:",
            })
        }
    });
}