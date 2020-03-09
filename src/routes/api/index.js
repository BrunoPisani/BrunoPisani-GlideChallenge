const apiRoutes = require('express').Router();
const config = require('../../utils/config.js');
const tools = require('../../utils/tools');

apiRoutes.get('/:resource', async (req, res) => {
  // Resource assignment and validation:
  const resource = req.params.resource.toLocaleUpperCase();
  if (typeof config[resource] === 'undefined') {
    return res.status(400).send('Error: unknown resource.');
  }

  // Querystring parameters assignment and validation:
  if (typeof req.query.offset !== 'undefined' && Array.isArray(req.query.offset)) {
    return res.status(400).send('Error: there can be only one offset value in the query string.');
  }
  const offset = (typeof req.query.offset !== 'undefined') ? parseInt(req.query.offset, 10) : config.DEFAULT_OFFSET;
  if (Number.isNaN(offset) || offset < 0) {
    return res.status(400).send('Error: offset value must be a positive integer number equal or greater than zero.');
  }
  if (typeof req.query.limit !== 'undefined' && Array.isArray(req.query.limit)) {
    return res.status(400).send('Error: there can be only one limit value in the query string.');
  }
  const limit = (typeof req.query.limit !== 'undefined') ? parseInt(req.query.limit, 10) : config.DEFAULT_LIMIT;
  if (Number.isNaN(limit) || limit < 0 || limit > config.MAX_LIMIT) {
    return res.status(400).send(`Error: limit value must be a positive integer number between 0 and ${config.MAX_LIMIT}.`);
  }
  const expandArray = (typeof req.query.expand !== 'undefined') ? (Array.isArray(req.query.expand) ? req.query.expand : [req.query.expand]) : [];
  expandArray.sort(tools.auxArraySortAscendant);
  for (let i = 0; i < expandArray.length; i++) {
    if (config[resource].expand_regex && (!config[resource].expand_regex.test(expandArray[i]) || expandArray[i] === '')) {
      return res.status(400).send('Error: malformed expand value in querystring.');
    }
    for (let j = i + 1; j < expandArray.length; j++) {
      if (parseInt(expandArray[i].indexOf(expandArray[j]), 10) === 0
        || parseInt(expandArray[j].indexOf(expandArray[i]), 10) === 0) {
        return res.status(400).send('Error: incompatible expand values in querystring.');
      }
    }
  }

  // Main endpoint logic (obtain data and expand as requested):
  try {
    const rootData = await tools.obtainDataSegment(resource, offset, limit);
    const expandMatrix = expandArray.map((expandString) => expandString.split('.'));

    const data = await tools.nestData(rootData, expandMatrix); // Main recursive function.

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).send(e.message);
  }
});


apiRoutes.get('/:resource/:id', async (req, res) => {
  // Resource assignment and validation:
  const resource = req.params.resource.toLocaleUpperCase();
  if (typeof config[resource] === 'undefined') {
    return res.status(400).send('Error: unknown resource.');
  }

  const { id } = req.params;

  // Querystring parameters assignment and validation:
  const expandArray = (typeof req.query.expand !== 'undefined') ? (Array.isArray(req.query.expand) ? req.query.expand : [req.query.expand]) : [];
  expandArray.sort(tools.auxArraySortAscendant);
  for (let i = 0; i < expandArray.length; i++) {
    if (config[resource].expand_regex && (!config[resource].expand_regex.test(expandArray[i]) || expandArray[i] === '')) {
      return res.status(400).send('Error: malformed expand value in querystring.');
    }
    for (let j = i + 1; j < expandArray.length; j++) {
      if (parseInt(expandArray[i].indexOf(expandArray[j]), 10) === 0
        || parseInt(expandArray[j].indexOf(expandArray[i]), 10) === 0) {
        return res.status(400).send('Error: incompatible expand values in querystring.');
      }
    }
  }

  // Main endpoint logic (obtain data and expand as requested):
  try {
    const { primaryKey } = config[resource];
    const rootData = await tools.obtainDataRecord(resource, primaryKey, id);
    const expandMatrix = expandArray.map((expandString) => expandString.split('.'));

    const data = await tools.nestData(rootData, expandMatrix); // Main recursive function.

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).send(e.message);
  }
});

apiRoutes.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to Big Corp API!' });
});

module.exports = apiRoutes;
