// LOAD VARIABLES
var botvars = require("./bot_vars.js");
var misspellingSolver = botvars.misspellingSolver;
var popularityDictionary = botvars.popularityDictionary;
var slackBot = botvars.slackBot;


// FUNCTIONS
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
      // console.log(body);
      // console.log(response);
    }
  }
  request(options, callback)
}

var getSimilarArtistNames = function(misspelled) {
  // ...make prettier the Dialogflow response ("Who is the artist?")
  var response = "Sorry, I didn't found him! I give you some hints:\n";

  // ...get the 3 most similar artist names and propose them to the user
  var result = misspellingSolver.get(misspelled);

  if (result == null)
    return "error";
  
  // compute popularity normalization
  var total = 0
  for (var i = 0; i < 3 && i < result.length; i++) {
      var value = popularityDictionary[result[i][1]];

      if (Number(value) == value)
        total += Number(value);
  }

  // fill in ranking
  var ranking = []
  for (var i = 0; i < 3 && i < result.length; i++) {
      var value = popularityDictionary[result[i][1]]
      var scorePopularity = Number(value) == value ? value / total : 0
      var score = 0.8 * result[i][0] + 0.2 * scorePopularity;
      var artist = {artist: result[i][1], score: score};
      ranking.push(artist)
  }

  // order ranking by score
  ranking.sort(function(a1, a2) {
    if (a1.score < a2.score) return 1;
    if (a1.score > a2.score) return -1;
    return 0;
  });

  for (var i = 0; i < 3 && i < result.length; i++)
      response += "- " + ranking[i].artist + "\n";
  
  return response 
}

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

var getWorkCard = function(title, year) {
  var workAttachment = {
    "attachments": [{
        "fallback": "ReferenceError - UI is not defined: https://honeybadger.io/path/to/event/",
        "fields": [
            {
                "title": "Title",
                "value": title,
                "short": true
            },
            {
                "title": "Year",
                "value": year,
                "short": true
            }
        ],
        "color": "#4283f4"
    }]
  }
  return workAttachment;
}

function doQuery(artist, number, instrument, strictly, yearstart, yearend, bot, message) {
  
  // DEFAULT NUMBER VALUE (IN CASE IS NOT GIVEN)
  var num;
  if (isNaN(parseInt(number))) {
    num = 10;
  }
  else {
    num = parseInt(number);
  }

  // JSON QUERY  
  // -> Init query
  var newQuery = 'SELECT sql:BEST_LANGMATCH(?title, "en, en-gb;q=0.8, fr=0.6; *;q=0.1", "en") as ?title, year(?comp) as ?year \
    WHERE { \
      ?expression a efrbroo:F22_Self-Contained_Expression ; \
        rdfs:label ?title ; \
        mus:U13_has_casting ?casting . \
      ?expCreation efrbroo:R17_created ?expression ; \
        ecrm:P4_has_time-span ?ts ; \
        ecrm:P9_consists_of / ecrm:P14_carried_out_by ?composer . \
      VALUES(?composer) { \
        (<http://data.doremus.org/artist/' + artist + '>) \
      } \
      ?ts time:hasEnd / time:inXSDDate ?comp .'
  
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
  if (instrument == null) {
    
    newQuery += '} \
                 ORDER BY rand() \
                 LIMIT ' + num
  }
  // -> Just one instrument
  else if (typeof instrument == "string") {
  
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
        //resp += ("  >  " + row["title"]["value"] + " - " + row["year"]["value"] + "\n");
        bot.reply(message, getWorkCard(row["title"]["value"], row["year"]["value"]));
      });

      //bot.reply(message, resp);
    }

  });
}

function doQueryPerformance(city, startyear, startmonth, startday, endyear, endmonth, endday, bot, message) {
  
  // JSON QUERY  
  var newQuery = 'SELECT ?title, ?subtitle, ?actorsName, ?placeName, ?date \
                  WHERE { \
                    ?performance a mus:M26_Foreseen_Performance ; \
                      ecrm:P102_has_title ?title ; \
                      ecrm:P69_has_association_with / mus:U6_foresees_actor ?actors ; \
                      mus:U67_has_subtitle ?subtitle ; \
                      mus:U7_foresees_place_at ?place ; \
                      mus:U8_foresees_time_span ?ts . \
                    ?place rdfs:label ?placeName . \
                    ?actors rdfs:label ?actorsName . \
                    ?ts time:hasBeginning / time:inXSDDate ?time ; \
                       rdfs:label ?date . \
                    FILTER ( ?time >= ' + startyear + '^^xsd:gYear AND ?time >= "2018-05"^^xsd:gYearMonth ) . \
                    FILTER ( contains(lcase(str(?placeName)), "' + city + '") ) \
                  } \
                  ORDER BY rand() \
                  LIMIT 1'
  
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
        resp += ("  >  " + row["title"]["value"] + " - " + row["subtitle"]["value"] +
                 " - " +  row["placeName"]["value"] + " - " + row["actorsName"]["value"] +
                 " - " + row["date"]["value"] + "\n");
      });

      bot.reply(message, resp);
    }

  });
}

var answerBio = function(bot, message, artist) {
  
    var query = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Fcomposer%2C+%3Fname%2C+%3Fbio%2C+xsd%3Adate%28%3Fd_date%29+as+%3Fdeath_date%2C+%3Fdeath_place%2C+xsd%3Adate%28%3Fb_date%29+as+%3Fbirth_date%2C+%3Fbirth_place%2C+%3Fimage%0D%0AWHERE+%7B%0D%0A++VALUES%28%3Fcomposer%29+%7B%28%3Chttp%3A%2F%2Fdata.doremus.org%2Fartist%2F" + artist +"%3E%29%7D+.%0D%0A++%3Fcomposer+foaf%3Aname+%3Fname+.%0D%0A++%3Fcomposer+rdfs%3Acomment+%3Fbio+.%0D%0A++%3Fcomposer+foaf%3Adepiction+%3Fimage+.%0D%0A++%3Fcomposer+schema%3AdeathDate+%3Fd_date+.%0D%0A++%3Fcomposer+dbpprop%3AdeathPlace+%3Fd_place+.%0D%0A++OPTIONAL+%7B+%3Fd_place+rdfs%3Alabel+%3Fdeath_place+%7D+.%0D%0A++%3Fcomposer+schema%3AbirthDate+%3Fb_date+.%0D%0A++%3Fcomposer+dbpprop%3AbirthPlace+%3Fb_place++.%0D%0A++OPTIONAL+%7B+%3Fb_place+rdfs%3Alabel+%3Fbirth_place+%7D+.%0D%0A++FILTER+%28lang%28%3Fbio%29+%3D+%27en%27%29%0D%0A%7D&format=json"

    const request = require('request');
    request(query, (err, res, body) => {
      if (err) { return console.log(err); }
      
      // JSON PARSING
      var json = JSON.parse(body)

      // RESPONSE
      var name = "";
      var bio = "";
      var birthPlace = "";
      var birthDate = "";
      var deathPlace = "";
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

// EXPORTS
exports.sendClearContext = sendClearContext;
exports.getSimilarArtistNames = getSimilarArtistNames;
exports.getBioCard = getBioCard;
exports.getWorkCard = getWorkCard;
exports.doQuery = doQuery;
exports.doQueryPerformance = doQueryPerformance;
exports.answerBio = answerBio;

// DEPRECATED
/*
var getUriAndAnswerBio = function(sessionID, resolvedName, bot, message) {
  var request = require('request');
  var options = {
    method: 'GET',
    uri: 'https://api.dialogflow.com/v1/entities/ebf4cca4-ea6b-4e55-a901-03338ea5691e?sessionId=' + sessionID,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.dialogflow
    }
  };

  function callback(error, response, body) {

    // JSON PARSING
    var json = JSON.parse(body)
    var found = false

    // NO forEach CONSTRUCT, BECAUSE OF UNIQUENESS!
    for(var i = 0; i < json["entries"].length; i++) {
      var entry = json["entries"][i]      
      for(var j = 0; j < entry["synonyms"].length; j++) {
        if(entry["synonyms"][j] === resolvedName) {

          // GET PARAMETERS
          var artist = entry["value"];
          // var number = message.entities["number"];

          found = true;
          break;
        }
      }

      if (found) {
        answerBio(bot, message, artist);
        break;
      }
    }
  };

  request(options, callback)
}


var getUriAndQuery = function(sessionID, resolvedName, number, bot, message) {
  var request = require('request');
  var options = {
    method: 'GET',
    uri: 'https://api.dialogflow.com/v1/entities/ebf4cca4-ea6b-4e55-a901-03338ea5691e?sessionId=' + sessionID,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.dialogflow
    }
  };

  function callback(error, response, body) {

    // JSON PARSING
    var json = JSON.parse(body)
    var found = false

    // NO forEach CONSTRUCT, BECAUSE OF UNIQUENESS!
    for(var i = 0; i < json["entries"].length; i++) {
      var entry = json["entries"][i]      
      for(var j = 0; j < entry["synonyms"].length; j++) {
        if(entry["synonyms"][j] === resolvedName) {

          // GET PARAMETERS
          var artist = entry["value"];
          // var number = message.entities["number"];

          found = true;
          break;
        }
      }

      if (found) {
        doQuery(artist, number, bot, message);
        break;
      }
    }
  };

  request(options, callback)
}
*/