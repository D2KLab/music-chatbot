/* LOGGER */

const fs = require('fs');
const eol = require('os').EOL;
const path = require('path');
const underscore = require('underscore');
const logFile = {};
const logDir = process.env.log_folder;
const threshold = 100*1024*1024;

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

// MODULE
module.exports = function() {

    logger = {};

    if (directoryExists(logDir) == false) {

        // init dir and file
        fs.mkdirSync(logDir);
        logFile.num = 0;
        logFile.name = "doremus_log_000.csv";
        fs.writeFileSync(path.join(logDir, logFile.name), getHeader());
    } else {

        // take the existing files
        var files = fs.readdirSync(logDir);
        // take only the log files with name format [0-9][0-9] and extension .csv
        var logFiles = files.filter( fileName => fileName.match("doremus_log"))

        if (logFiles.length == 0) {

            // dir empty: init first file
            logFile.num = 0;
            //logFile.name = ('0' + logFile.num).slice(-2) + ".csv";
            logFile.name = "doremus_log_000.csv"; 
            fs.writeFileSync(path.join(logDir, logFile.name), getHeader());
        } else {

            // dir not-empty: take last modified file
            logFile.name = underscore.max(logFiles, function(file) {
                var logFilePath = path.join(logDir, file);
                return fs.statSync(logFilePath).mtime;
            });
            logFile.num = parseInt(logFile.name.slice(-7, -4));
        }
    }

    logger.write = function(platform, user, team, intent, response, rawMessage, cleanMessage, lang, confidence) {

        // prepare new line with timestamp and other infos
        const timestamp = new Date().toLocaleString();
        const data = `${timestamp},${platform},${user},${team},${intent},${confidence},${lang},${rawMessage},${cleanMessage},${response}${eol}`;

        // append the line to the csv file
        logFilePath = path.join(logDir, logFile.name);
        fs.appendFile(logFilePath, data, (error) => {

            if (error) {
                console.error(`Write error to ${logFilePath}: ${error.message}`);
            } else {

                // threshold reached: update name/num to create a new file next time
                if (fs.statSync(logFilePath).size > threshold) {
                    if (logFile.num === 999) {
                        console.warn('Exceeded maximum number of log files! Appending to the last one...');
                    } else {
                        logFile.num += 1;
                        logFile.name = "doremus_log_" + logFile.num.toString().padStart(3, "0") + ".csv";
                        fs.writeFileSync(path.join(logDir, logFile.name), getHeader());
                    }
                }
            }
        });
    }

    return logger;
}