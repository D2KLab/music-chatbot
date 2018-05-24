/* SPELL CHECKER MIDDLEWARE */

var nspell = require('nspell')
const fs = require('fs');
var request = require('request');
var http = require('http');

var enDIC = fs.readFileSync("./node_modules/dictionary-en-us/index.dic", 'utf-8')
var enAFF = fs.readFileSync("./node_modules/dictionary-en-us/index.aff", 'utf-8')
var spellEN = nspell(enAFF, enDIC)

var frDIC = fs.readFileSync("./node_modules/dictionary-fr/index.dic", 'utf-8')
var frAFF = fs.readFileSync("./node_modules/dictionary-fr/index.aff", 'utf-8')
var spellFR = nspell(frAFF, frDIC)

var speller = spellEN
var currentLang = "en"
var showNewSentence = false


// FIXED GREETINGS
var greetings = {};
greetings["hello"] = true;
greetings["hi"] = true;
greetings["good morning"] = true;
greetings["good evening"] = true;
greetings["hey"] = true;
greetings["bonjour"] = true;
greetings["bonsoir"] = true;
greetings["salut"] = true;


// FUNCTION TO DETECT IF MESSAGE IS GREETING
var isGreetings = function(message) {
    var lowerCaseMessage = message.text.toLowerCase();
    if (greetings[lowerCaseMessage]) return true;
    return false;
}


// FUNCTION TO PERFORM THE SPELL CHECK
var performMisspellingCheck = function(message) {

    // empty string where to append corrected words
    var messageMisspelledFree = "";
    var words = message.text.split(" ");
    
    // initially assume there is no correction neeeded
    showNewSentence = false

    for (var i = 0; i < words.length; i++) {

        // check for each word if is it misspelled
        if (speller.correct(words[i]) == false && isNaN(words[i])) {

            var corrections = speller.suggest(words[i])
            if (corrections.length > 0) {
                // if it is and at least a correction exists append the first one
                messageMisspelledFree += corrections[0] + ' ';
                // set the global var to true in order to show that a correction happened
                // in the next response to the user
                showNewSentence = true
            } else {
                // otherwise append the original word
                messageMisspelledFree += words[i] + ' ';
            }
        } else {
            // otherwise append the original word
            messageMisspelledFree += words[i] + ' ';
        }
    }
    return messageMisspelledFree;
}


// SPELL-CHECKER MIDDLEWARE FUNCTION
module.exports = function() {

    var middleware = {}

    middleware.receive = function(bot, message, next) {

        if (!message.text) {
            next();
            return;
        }

        if (message.is_echo || message.type === 'self_message') {
            next();
            return;
        }

        // trigger language detection in case of long sentences or greetings
        if (message.text.split(" ").length > 1 || isGreetings(message)) {

            // LANGUAGE CHECK
            // prepare arguments for the request to Google Translate API
            var url = "https://translate.googleapis.com/translate_a/single"
            var parameters = {
                q: message.text,
                dt: 't',
                tl: 'it',
                sl: 'auto',
                client: 'gtx',
                hl: 'it'
            };

            request({
                url: url,
                qs: parameters
            }, function(err, response, body) {
                if (err) {
                    console.log("Error during language detection");
                    next(err);
                }

                // get language from json
                var res = JSON.parse(body);
                var lang = res[2];

                // update accordingly the speller and the global var 
                if (lang == "fr") {
                    speller = spellFR;
                    currentLang = "fr";
                } else if (lang == "en") {
                    speller = spellEN;
                    currentLang = "en";
                }
                //otherwise don't change anything
                
                // SPELL CHECKING
                // perform the misspelling with the (potentially) updated speller
                var cleanMessage = performMisspellingCheck(message)
                message.text = cleanMessage;

                // fill the language field in order to send it to dialogflow api
                message.lang = currentLang;
                next()
            });
        } else {

            // perform the misspelling with the same speller as before
            var cleanMessage = performMisspellingCheck(message)
            message.text = cleanMessage;

            // fill the language field in order to send it to dialogflow api
            message.lang = currentLang;
            next();
        }
        return;
    }

    middleware.showNewSentence = function() {
        return showNewSentence;
    }

    middleware.currectLang = function() {
        return currentLang;
    }

    return middleware;
}