module.exports = (webserver, controller, config) => {
  // This creates the /embed route, where an easy-to-copy embed code is available
  webserver.get('/embed', (req, res) => {
    res.render('embed', {
      layout: 'layouts/default',
      base_url:
        (req.get('X-Forwarded-Host') || req.get('Host')) + config.baseUrl
    });
  });

  // This creates the /embed route, where an easy-to-copy embed code is available
  webserver.get('/', (req, res) => {
    res.render('index', {
      layout: 'layouts/default',
      base_url:
        (req.get('X-Forwarded-Host') || req.get('Host')) + config.baseUrl
    });
  });
};
