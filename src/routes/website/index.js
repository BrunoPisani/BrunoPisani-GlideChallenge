const websiteRoutes = require('express').Router();

websiteRoutes.get('/', (req, res) => {
  res.send('Welcome to Big Corp Website!');
});

module.exports = websiteRoutes;
