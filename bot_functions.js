// LOAD VARIABLES
var botvars = require("./bot_vars.js");
var misspellingSolver = botvars.misspellingSolver;
var popularityDictionary = botvars.popularityDictionary;
var slackBot = botvars.slackBot;


// FUNCTIONS
/*******************************************************************************/
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
/*******************************************************************************/


/*******************************************************************************/
var getBioCard = function(fullname, birthPlace, birthDate, deathPlace, deathDate, imageURL, bio) {
  var imageURLHTTPDropped = imageURL.split("://")[1]
  var bioAttachment = {
    "attachments": [{
        "pretext": "This is what I found:",
        "fallback": "ReferenceError - UI is not defined: https://honeybadger.io/path/to/event/",
        "title" : fullname,
        "image_url": "https://rsz.io/" + imageURLHTTPDropped + "?mode=crop&width=150&height=150",
        "fields": [
            {
                "title": "Born in",
                "value": birthPlace,
                "short": true
            },
            {
                "title": "Birthdate",
                "value": birthDate,
                "short": true
            },
            {
                "title": "Dead in",
                "value": deathPlace,
                "short": true
            },
            {
                "title": "Death date",
                "value": deathDate,
                "short": true
            },
            {
                "title": "Bio",
                "value": bio, 
                "short": false
            }
        ],
        "color": "good"
    }]
  }
  return bioAttachment;
}
/*******************************************************************************/

/*******************************************************************************/
var getArtistCard = function(fullname, birthPlace, birthDate, deathPlace, deathDate, count) {

  var artistAttachment = {
    "attachments": [{
        "fallback": "ReferenceError - UI is not defined: https://honeybadger.io/path/to/event/",
        "title" : fullname,
        "fields": [
            {
                "title": "Born in",
                "value": birthPlace,
                "short": true
            },
            {
                "title": "Birthdate",
                "value": birthDate,
                "short": true
            },
            {
                "title": "Dead in",
                "value": deathPlace,
                "short": true
            },
            {
                "title": "Death date",
                "value": deathDate,
                "short": true
            },
            {
                "title": "Number of works",
                "value": count,
                "short": true
            }
        ],
        "color": "good"
    }]
  }
  return artistAttachment;
}
/*******************************************************************************/

/*******************************************************************************/
var getWorkCard = function(title, artist, year, genre, comment, key) {
  var workAttachment = {
    "attachments": [{
        "title": title,
        "fallback": "ReferenceError - UI is not defined: https://honeybadger.io/path/to/event/",
        "fields": [
            {
                "title": "Artist",
                "value": artist,
                "short": true
            },
            {
                "title": "Year",
                "value": year,
                "short": true
            },
            {
                "title": "Genre",
                "value": genre,
                "short": true
            },
            {
                "title": "Key",
                "value": key,
                "short": true
            },
            {
                "title": "Comment",
                "value": comment,
                "short": false
            }
        ],
        "color": "#4283f4"
    }]
  }
  return workAttachment;
}
/*******************************************************************************/


/*******************************************************************************/
var getPerformanceCard = function(title, subtitle, placeName, actorsName, date) {
  var performanceAttachment = {
    "attachments": [{
        "title": title,
        "text": subtitle,
        "fallback": "ReferenceError - UI is not defined: https://honeybadger.io/path/to/event/",
        "fields": [
            {
                "title": "Where",
                "value": placeName,
                "short": true
            },
            {
                "title": "When",
                "value": date,
                "short": true
            },
            {
                "title": "Actors",
                "value": actorsName,
                "short": false
            }
        ],
        "color": "#f4b042"
    }]
  }
  return performanceAttachment;
}
/*******************************************************************************/


/*******************************************************************************/
function doQuery(artist, number, instrument, strictly, yearstart, yearend, genre, bot, message) {
  
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
        
        bot.reply(message, getWorkCard(title, artist, year, genre, comment, key));
      });
    }

  });
}
/*******************************************************************************/

/*******************************************************************************/
function doQueryPerformance(number, city, startdate, enddate, bot, message) {
  
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
        bot.reply(message, getPerformanceCard(title, subtitle, placeName, actorsName, date));
      });
    }
  });
}
/*******************************************************************************/


/*******************************************************************************/
function doQueryFindArtist(num, startdate, enddate, city, instrument, genre, bot, message) {
  
  // JSON QUERY  
  var newQuery = ''
  
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
        var attachment = getArtistCard(name, birthPlace, birthDate, deathPlace, deathDate, count)
        bot.reply(message, attachment);
      });
    }
  });
}
/*******************************************************************************/


/*******************************************************************************/
var answerBio = function(bot, message, artist) {
  
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
        var attachment = getBioCard(name, birthPlace, birthDate, deathPlace, deathDate, image, bio)
        bot.reply(message, attachment);
      }
    });
}
/*******************************************************************************/

// EXPORTS
exports.sendClearContext = sendClearContext;
exports.getBioCard = getBioCard;
exports.getWorkCard = getWorkCard;
exports.doQuery = doQuery;
exports.doQueryPerformance = doQueryPerformance;
exports.answerBio = answerBio;
exports.doQueryFindArtist = doQueryFindArtist;
