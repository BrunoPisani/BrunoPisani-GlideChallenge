const routes = require('express').Router();
const config = require('../../utils/config.js');

const resource = 'OFFICES';

routes.get('/', (req, res) => {
  if (req.query.offset !== undefined && Array.isArray(req.query.offset)) {
    return res.status(400).send('Error: there can be only one offset value in the query string.');
  }
  const offset = (typeof req.query.offset !== 'undefined') ? parseInt(req.query.offset, 10) : config.DEFAULT_OFFSET;
  if (Number.isNaN(offset) || offset < 0) {
    return res.status(400).send('Error: offset value must be a positive integer number equal or greater than zero.');
  }
  if (req.query.limit !== undefined && Array.isArray(req.query.limit)) {
    return res.status(400).send('Error: there can be only one limit value in the query string.');
  }
  const limit = (typeof req.query.limit !== 'undefined') ? parseInt(req.query.limit, 10) : config.DEFAULT_LIMIT;
  if (Number.isNaN(limit) || limit < 0 || limit > config.MAX_LIMIT) {
    return res.status(400).send(`Error: limit value must be a positive integer number between 0 and ${config.MAX_LIMIT}.`);
  }

  return res.status(200).json([...config[resource].data].slice(offset, offset + limit));
});

routes.get('/:id', (req, res) => {
  const { id } = req.params;

  const jsonData = config[resource].data.find((item) => {
    if (item.id.toString() === id) {
      return true;
    }
    return false;
  });

  return res.status(200).json(jsonData);
});

module.exports = routes;
