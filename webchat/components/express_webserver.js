/* eslint-disable global-require,import/no-dynamic-require */
const express = require('express');
const bodyParser = require('body-parser');
const debug = require('debug')('botkit:webserver');
const http = require('http');
const fs = require('fs');
const hbs = require('express-hbs');

module.exports = (controller, config) => {
  const webserver = express();
  webserver.use(bodyParser.json());
  webserver.use(bodyParser.urlencoded({ extended: true }));

  // set up handlebars ready for tabs
  webserver.engine(
    'hbs',
    hbs.express4({ partialsDir: `${__dirname}/../views/partials` })
  );
  webserver.set('view engine', 'hbs');
  webserver.set('views', `${__dirname}/../views/`);

  webserver.use(express.static(`${__dirname}/../public`));

  const server = http.createServer(webserver);

  server.listen(config.port || 3003, null, () => {
    debug(
      `Express webserver configured and listening at http://localhost:${
        config.port
      }` || 3003
    );
  });

  // import all the pre-defined routes that are present in /components/routes
  const normalizedPathToRoutes = require('path').join(__dirname, 'routes');
  if (fs.existsSync(normalizedPathToRoutes)) {
    fs.readdirSync(normalizedPathToRoutes).forEach(file => {
      require(`./routes/${file}`)(webserver, controller, config);
    });
  }

  controller.webserver = webserver;
  controller.httpserver = server;

  return webserver;
};
