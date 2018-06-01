/* LOGGER */

const fs = require('fs');
const eol = require('os').EOL;
const path = require('path');
const underscore = require('underscore');
const logFile = {};
const logDir = path.join(__dirname, 'logs');
const threshold = 1000000;

// FUNCTION TO CHECK IF DIRECTORY EXISTS
function directoryExists(path) {
    try {
        return fs.statSync(path).isDirectory();
    } catch (err) {
        return false;
    }
}

// MODULE
module.exports = function() {

    logger = {};

    if (directoryExists(logDir) == false) {

        // init dir and file
        fs.mkdirSync(logDir);
        logFile.num = 0;
        logFile.name = ('0' + logFile.num).slice(-2) + ".csv";
        fs.writeFileSync(path.join(logDir, logFile.name),
                         "timestamp,platform,user,team,rawMessage,cleanMessage,lang" + eol);
    } else {

        // take the existing files
        var files = fs.readdirSync(logDir);

        if (files.length == 0) {

            // dir empty: init first file
            logFile.num = 0;
            logFile.name = ('0' + logFile.num).slice(-2) + ".csv";
            fs.writeFileSync(path.join(logDir, logFile.name),
                             "timestamp,platform,user,team,rawMessage,cleanMessage,lang" + eol);
        } else {

            // dir not-empty: take last modified file
            logFile.name = underscore.max(files, function(file) {
                var logFilePath = path.join(logDir, file);
                return fs.statSync(logFilePath).mtime;
            });
            logFile.num = parseInt(logFile.name.slice(-2));
        }
    }

    logger.write = function(platform, user, team, rawMessage, cleanMessage, lang) {

        // prepare new line with timestamp and other infos
        const timestamp = new Date().toLocaleString();
        const data = `${timestamp},${platform},${user},${team},${rawMessage},${cleanMessage},${lang}${eol}`;

        // append the line to the csv file
        logFilePath = path.join(logDir, logFile.name);
        fs.appendFile(logFilePath, data, (error) => {

            if (error) {
                console.error(`Write error to ${logFilePath}: ${error.message}`);
            } else {

                // threshold reached: update name/num to create a new file next time
                if (fs.statSync(logFilePath).size > threshold) {
                    logFile.num += 1;
                    logFile.name = ('0' + logFile.num).slice(-2) + ".csv";
                }
            }
        });
    }

    return logger;
}