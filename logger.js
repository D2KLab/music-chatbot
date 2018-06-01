const fs = require('fs');
const eol = require('os').EOL;
const path = require('path');
const logFileName = "inbound.csv"
var logFolder = path.join(__dirname, 'logs')

function directoryExists(path) {
	try {
		return fs.statSync(path).isDirectory();
	} catch (err) {
		return false;
	}
}

module.exports = function() {
	logger = {};

	if (directoryExists(logFolder) == false) {
		fs.mkdirSync(logFolder);
	} else {
		//check all the files inside the folder
		//take the lastone
	}

	logger.write = function(platform, rawMessage, cleanMessage, lang) {
		//write new csv line with timestamp
		const timestamp = new Date().toLocaleString();
		const data = `${timestamp},${platform},${rawMessage},${cleanMessage},${lang}${eol}`;
		logFile = path.join(logFolder, logFileName);
		console.log(logFile)
		fs.appendFile(logFile, data, (error) => {
			if (error) {
				console.error(`Write error to ${logFile}: ${error.message}`);
			} else {
				//check the dimension of current used file is good
				//otherwise create new one and update cur var
			}
		});
	}
	return logger;
}