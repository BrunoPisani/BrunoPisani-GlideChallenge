const departmentsRoutes = require('express').Router();
const config = require('../../utils/config.js');
const tools = require('../../utils/tools');

const resource = 'DEPARTMENTS';

departmentsRoutes.get('/', (req, res) => {
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
  const expandArray = (typeof req.query.expand !== 'undefined') ? (Array.isArray(req.query.expand) ? req.query.expand.sort((a,b)=>{return a<b}) : [req.query.expand]) : [];
  //expandArray.sort(tools.sortAscendant);
  for (let i = 0; i < expandArray.length; i++) {
    if (!config[resource].expand_regex.test(expandArray[i])) {
      return res.status(400).send('Error: malformed expand value in querystring.');
    }
    for (let j = i + 1; j < expandArray.length; j++) {
      if (parseInt(expandArray[i].indexOf(expandArray[j]), 10) === 0 || parseInt(expandArray[j].indexOf(expandArray[i]) === 0, 10)) {
        return res.status(400).send('Error: incompatible expand values in querystring.');
      }
    }
  }

  const expandMatrix = expandArray.map((expandString) => expandString.split('.'));
  console.log('B:', expandMatrix);

  const departmentsSubset = [...departments].slice(offset, offset + limit);

  /*for (let e = 0; e < expandArray.length; e++) {
    const expandSplitted = expandArray[e].split('.');
    for (let i = 0; i < departmentsSubset.length; i++) {
      departmentsSubset[i] = nestResource(departments, departmentsSubset[i], expandSplitted);
    }
  }*/

  return res.status(200).json(departmentsSubset);
});

departmentsRoutes.get('/:id', (req, res) => {
  const expand = (typeof req.query.expand !== 'undefined') ? req.query.expand : undefined;
  if (expand && !config[resource].expand_regex.test(expand)) {
    return res.status(400).send('Error: malformed expand value in querystring.');
  }
  const { id } = req.params;
  let department = {
    ...departments.find((d) => {
      if (d.id.toString() === id) {
        return true;
      }
      return false;
    })
  };
  if (Object.keys(department).length === 0) { // If no department was found, find returns {}
    res.status(404).send(`Resource with id ${id} not found.`);
  }

  const expandArray = (typeof expand !== 'undefined') ? expand.split('.') : [];
  department = nestResource(departments, department, expandArray);
  return res.status(200).send(department);
});

function nestResource(paramCollectionArray, paramResource, paramExpandArray) {
  const collectionArray = [...paramCollectionArray];
  const resource = { ...paramResource };
  const expandArray = [...paramExpandArray];
  const keyword = expandArray.shift();
  if (typeof keyword === 'undefined' || !resource[keyword]) {
    return resource;
  }
  const nestedResource = {
    ...collectionArray.find((d) => {
      if (d.id === resource[keyword]) {
        return true;
      }
      return false;
    })
  };
  resource[keyword] = nestResource(collectionArray, nestedResource, expandArray);
  return resource;
}

module.exports = departmentsRoutes;
