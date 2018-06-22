/* LOGGER */

const fs = require('fs');
const eol = require('os').EOL;
const path = require('path');
const underscore = require('underscore');
const logFile = {};
const logDir = process.env.log_folder;

// FUNCTION TO CHECK IF DIRECTORY EXISTS
function directoryExists(path) {
    try {
        return fs.statSync(path).isDirectory();
    } catch (err) {
        return false;
    }
}

function getHeader() {
    return "timestamp,platform,user,channel,intent,confidence,lang,rawMessage,cleanMessage,response" + eol;
}

function getFileNameByDate() {

    const today = new Date();
    const year = today.getFullYear().toString();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    return 'doremus_log_' + year + '-' + month + '.csv';
}

// MODULE
module.exports = function() {

    logger = {};

    if (directoryExists(logDir) == false) {

        // init dir and file
        fs.mkdirSync(logDir);
    }

    logger.write = function(platform, user, team, intent, response, cleanMessage, rawMessage, lang, confidence) {

        // sanitize
        response = response.replace(',','');
        rawMessage = rawMessage.replace(',','');
        cleanMessage = cleanMessage.replace(',','');

        // prepare new line with timestamp and other infos
        const timestamp = new Date().toLocaleString();
        const data = `${timestamp},${platform},${user},${team},${intent},${confidence},${lang},${rawMessage},${cleanMessage},${response}${eol}`;

        // get month file
        const fileName = getFileNameByDate();

        // append the line to the csv file
        logFilePath = path.join(logDir, fileName);

        // if file doesn't exist, print header
        if (!fs.existsSync(logFilePath)) {
            fs.writeFileSync(logFilePath, getHeader());
        }

        // write (appending to the file)
        fs.appendFile(logFilePath, data, (error) => {

            if (error) {
                console.error(`Write error to ${logFilePath}: ${error.message}`);
            }
        });
    }

    return logger;
}