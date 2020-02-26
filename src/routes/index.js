const apiRoutes = require('express').Router();

const resources = require('./resources')

apiRoutes.use('/', resources);

module.exports = apiRoutes;
