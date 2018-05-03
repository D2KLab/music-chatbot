// LOAD VARIABLES AND FUNCTIONS
var slackCards = require("./slack_cards.js");

// FUNCTIONS
/*******************************************************************************/
module.exports = function sendClearContext(sessionID) {
  
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
/*******************************************************************************/


/*******************************************************************************/
module.exports = function doQuery(artist, number, instrument, strictly, yearstart, yearend, genre, bot, message) {
  
  // DEFAULT NUMBER VALUE (IN CASE IS NOT GIVEN)
  var num = 5;
  if (!isNaN(parseInt(number))) {
    num = parseInt(number);
  }

  // JSON QUERY  
  // -> Init query
  var newQuery = 'SELECT DISTINCT ?expression, ?title, ?artist, ?year, ?genre, ?comment, ?key \
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
  }
  else if (yearstart != null && yearend == null) {
    newQuery += 'FILTER ( ?comp >= "' + yearstart + '"^^xsd:gYear ) .'
  }
  else if (yearstart == null && yearend != null) {
    newQuery += 'FILTER ( ?comp <= "' + yearend + '"^^xsd:gYear ) .'
  }
  
  // -> No instrument
  if (instrument.length == 0) {
    
    newQuery += '} \
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
                 ORDER BY rand() \
                 LIMIT ' + num
    }
  }
  
  // -> Finalize the query
  var queryPrefix = 'http://data.doremus.org/sparql?default-graph-uri=&query='
  var querySuffix = '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
  var finalQuery = queryPrefix + encodeURI(newQuery) + querySuffix
  
  // -> Do the HTTP request
  const request = require('request');
  request(finalQuery, (err, res, body) => {

    if (err) { return console.log(err); }

    // JSON PARSING
    var json = JSON.parse(body)

    // RESPONSE
    if (json["results"]["bindings"].length === 0) {
      
      bot.reply(message, "Sorry... I didn't find anything!");
    }
    else {
      
      var resp = "This is the list:\n";
      json["results"]["bindings"].forEach(function(row) {
        
        var artist = row["artist"]["value"];
        var title = row["title"]["value"];
        var year = row["year"]["value"];
        var genre = row["genre"]["value"];
        var comment = row["comment"]["value"];
        var key = row["key"] !== undefined ? row["key"]["value"]: '-';
        
        bot.reply(message, slackCards.getWorkCard(title, artist, year, genre, comment, key));
      });
    }

  });
}
/*******************************************************************************/

/*******************************************************************************/
module.exports = function doQueryPerformance(number, city, startdate, enddate, bot, message) {
  
  // JSON QUERY  
  var newQuery = 'SELECT DISTINCT ?performance, \
                    ?title, \
                    ?subtitle, \
                    ?actorsName, \
                    ?placeName, \
                    ?date \
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
               ORDER BY rand() \
               LIMIT ' + number
  
  // -> Finalize the query
  var queryPrefix = 'http://data.doremus.org/sparql?default-graph-uri=&query='
  var querySuffix = '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
  var finalQuery = queryPrefix + encodeURI(newQuery) + querySuffix
  
  // -> Do the HTTP request
  const request = require('request');
  request(finalQuery, (err, res, body) => {

    if (err) { return console.log(err); }

    // JSON PARSING
    var json = JSON.parse(body)

    // RESPONSE
    if (json["results"]["bindings"].length === 0) {
      
      bot.reply(message, "Sorry... I didn't find anything!");
    }
    else {
      var resp = "This is the list:\n";
      json["results"]["bindings"].forEach(function(row) {
        var title = row["title"]["value"];
        var subtitle = row["subtitle"]["value"];
        var placeName = row["placeName"]["value"];
        var actorsName = row["actorsName"]["value"];
        var date = row["date"]["value"];
        bot.reply(message, slackCards.getPerformanceCard(title, subtitle, placeName, actorsName, date));
      });
    }
  });
}
/*******************************************************************************/


/*******************************************************************************/
module.exports = function doQueryFindArtist(num, startdate, enddate, city, instrument, genre, bot, message) {
  
  // JSON QUERY  
  var newQuery = 'SELECT SAMPLE(?name) AS ?name, count(distinct ?expr) AS ?count, \
                    SAMPLE(xsd:date(?d_date)) AS ?death_date, SAMPLE(?death_place) AS ?death_place, \
                    SAMPLE(xsd:date(?b_date)) AS ?birth_date, SAMPLE(?birth_place) AS ?birth_place \
                  WHERE { \
                    ?composer foaf:name ?name . \
                    ?composer schema:deathDate ?d_date . \
                    ?composer dbpprop:deathPlace ?d_place . \
                    OPTIONAL { ?d_place rdfs:label ?death_place } . \
                    ?composer schema:birthDate ?b_date . \
                    ?composer dbpprop:birthPlace ?b_place . \
                    OPTIONAL { ?b_place rdfs:label ?birth_place } . \
                    ?exprCreation efrbroo:R17_created ?expr ; \
                      ecrm:P9_consists_of / ecrm:P14_carried_out_by ?composer . \
                    ?expr mus:U12_has_genre ?gen ; \
                      mus:U13_has_casting ?casting .'

  if (genre !== "") {
    newQuery += 'VALUES(?gen) { \
                   (<http://data.doremus.org/vocabulary/iaml/genre/' + genre + '>) \
                 } .'
  }
  
  if (instrument !== "") {
    newQuery += '?casting mus:U23_has_casting_detail ?castingDetail . \
                 ?castingDetail mus:U2_foresees_use_of_medium_of_performance \
		                            / skos:exactMatch* ?instrument . \
                 VALUES(?instrument) { \
                   (<http://data.doremus.org/vocabulary/iaml/mop/' + instrument + '>) \
                 } .'
  }
  
  if (startdate !== "" && enddate !== "") {
    newQuery += 'FILTER ( ?b_date >= "' + startdate + '"^^xsd:date AND ?b_date <= "' + enddate + '"^^xsd:date ) .'
  }
  
  if (city !== "") {
    newQuery += 'FILTER ( contains(lcase(str(?birth_place)), "' + city + '") ) .'
  }

  newQuery += '} \
               GROUP BY ?composer \
               ORDER BY DESC(?count) \
               LIMIT ' + num
  
  // -> Finalize the query
  var queryPrefix = 'http://data.doremus.org/sparql?default-graph-uri=&query='
  var querySuffix = '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
  var finalQuery = queryPrefix + encodeURI(newQuery) + querySuffix
  
  // -> Do the HTTP request
  const request = require('request');
  request(finalQuery, (err, res, body) => {

    if (err) { return console.log(err); }

    // JSON PARSING
    var json = JSON.parse(body)

    // RESPONSE
    if (json["results"]["bindings"].length === 0) {
      
      bot.reply(message, "Sorry... I didn't find anything!");
    }
    else {
      var resp = "This is the list:\n";
      json["results"]["bindings"].forEach(function(row) {
        
        var name = row["name"]["value"];
        var birthPlace = row["birth_place"] !== undefined ? row["birth_place"]["value"]: '-';
        var birthDate = row["birth_date"]["value"];
        var deathPlace = row["death_place"] !== undefined ? row["death_place"]["value"]: '-';
        var deathDate = row["death_date"]["value"];
        var count = row["count"]["value"];
        
        // CREATE ATTACHMENT
        var attachment = slackCards.getArtistCard(name, birthPlace, birthDate, deathPlace, deathDate, count)
        bot.reply(message, attachment);
      });
    }
  });
}
/*******************************************************************************/


/*******************************************************************************/
module.exports = function answerBio(bot, message, artist) {
  
    var newQuery = 'SELECT DISTINCT ?composer, \
                    ?name, \
                    ?bio, \
                    xsd:date(?d_date) AS ?death_date, \
                    ?death_place, \
                    xsd:date(?b_date) AS ?birth_date, \
                    ?birth_place, \
                    ?image \
                    WHERE { \
                      VALUES(?composer) {(<http://data.doremus.org/artist/' + artist + '>)} . \
                      ?composer rdfs:comment ?bio . \
                      ?composer foaf:depiction ?image . \
                      ?composer schema:deathDate ?d_date . \
                      ?composer foaf:name ?name . \
                      ?composer dbpprop:deathPlace ?d_place . \
                      OPTIONAL { ?d_place rdfs:label ?death_place } . \
                      ?composer schema:birthDate ?b_date . \
                      ?composer dbpprop:birthPlace ?b_place . \
                      OPTIONAL { ?b_place rdfs:label ?birth_place } . \
                      FILTER (lang(?bio) = "en") \
                    }'
    
    // -> Finalize the query
    var queryPrefix = 'http://data.doremus.org/sparql?default-graph-uri=&query='
    var querySuffix = '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
    var finalQuery = queryPrefix + encodeURI(newQuery) + querySuffix
  
    const request = require('request');
    request(finalQuery, (err, res, body) => {
      if (err) { return console.log(err); }
      
      // JSON PARSING
      var json = JSON.parse(body)

      // RESPONSE
      var name = "";
      var bio = "";
      var birthPlace = "-";
      var birthDate = "";
      var deathPlace = "-";
      var deathDate = "";
      var image = ""

      var row = json["results"]["bindings"][0];
      if (row == undefined) {
        bot.reply(message, "Sorry, there was an error! Retry later.");
      }
      else {
        name = row["name"]["value"];
        bio = row["bio"]["value"];
        if (row["birth_place"])
          birthPlace = row["birth_place"]["value"];
        birthDate = row["birth_date"]["value"];
        if (row["death_place"])
          deathPlace = row["death_place"]["value"];
        deathDate = row["death_date"]["value"];
        image = row["image"]["value"];

        // CREATE ATTACHMENT
        var attachment = slackCards.getBioCard(name, birthPlace, birthDate, deathPlace, deathDate, image, bio)
        bot.reply(message, attachment);
      }
    });
}
/********************************************************************************/
