const resourcesRoutes = require('express').Router();
const axios = require('axios');
const config = require('../../utils/config.js');
const tools = require('../../utils/tools');

resourcesRoutes.get('/:resource', async (req, res) => {
  const resource = req.params.resource.toLocaleUpperCase();

  // Validation of querystring parameters:
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
  const expandArray = (typeof req.query.expand !== 'undefined') ? (Array.isArray(req.query.expand) ? req.query.expand : [req.query.expand]) : [];
  expandArray.sort(tools.sortAscendant);
  for (let i = 0; i < expandArray.length; i++) {
    if (config[resource].expand_regex && (!config[resource].expand_regex.test(expandArray[i]) || expandArray[i] === "")) {
      return res.status(400).send('Error: malformed expand value in querystring.');
    }
    for (let j = i + 1; j < expandArray.length; j++) {
      if (parseInt(expandArray[i].indexOf(expandArray[j]), 10) === 0
      || parseInt(expandArray[j].indexOf(expandArray[i]), 10) === 0) {
        return res.status(400).send('Error: incompatible expand values in querystring.');
      }
    }
  }

  const expandMatrix = expandArray.map((expandString) => expandString.split('.'));

  try {
    const rootData = (config[resource].data) ? [...config[resource].data].slice(offset, offset + limit) : (await axios.get(`${config[resource].url}?limit=${limit}&offset=${offset}`)).data;
    const data = await tools.nestData([...rootData], [...expandMatrix]);

    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).send(e);
  }
});


resourcesRoutes.get('/:resource/:id', async (req, res) => {
  const resource = req.params.resource.toLocaleUpperCase();
  const { id } = req.params;

  const expandArray = (typeof req.query.expand !== 'undefined') ? (Array.isArray(req.query.expand) ? req.query.expand : [req.query.expand]) : [];
  expandArray.sort(tools.sortAscendant);
  for (let i = 0; i < expandArray.length; i++) {
    if (config[resource].expand_regex && (!config[resource].expand_regex.test(expandArray[i]) || expandArray[i] === "")) {
      return res.status(400).send('Error: malformed expand value in querystring.');
    }
    for (let j = i + 1; j < expandArray.length; j++) {
      if (parseInt(expandArray[i].indexOf(expandArray[j]), 10) === 0
      || parseInt(expandArray[j].indexOf(expandArray[i]), 10) === 0) {
        return res.status(400).send('Error: incompatible expand values in querystring.');
      }
    }
  }

  const expandMatrix = expandArray.map((expandString) => expandString.split('.'));

  try {
    const rootData = (config[resource].data) ? [tools.searchById(id, config[resource].data)] : (await axios.get(`${config[resource].url}?id=${id}`)).data;
    const data = await tools.nestData([...rootData], [...expandMatrix]);

    return res.status(200).json(data);
  } catch (e) {
    return res.status(400).send(e);
  }
});

resourcesRoutes.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to Big Corp API!' });
});

module.exports = resourcesRoutes;
