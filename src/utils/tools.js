const axios = require('axios');
const config = require('./config.js');

module.exports.auxArraySortAscendant = (a, b) => {
  if (a < b) {
    return -1;
  }
  return 1;
};

module.exports.nestData = async (rootData, expandMatrix) => {
  let expandedData = [...rootData];

  if (expandMatrix.length === 0 || isMatrix2DEmpty(expandMatrix)) {
    return expandedData;
  }

  const expandBranches = groupExpands(expandMatrix);

  const startNesting = async () => {
    await asyncForEach(expandBranches, async (branch) => {
      const keyword = branch[0][0];
      const newExpandMatrix = branch.map((b) => { b.shift(); return b; });
      const foreignKeysArray = [];

      for (let i = 0; i < rootData.length; i++) {
        const keyValue = rootData[i][keyword];
        if (keyValue !== null) {
          if (!foreignKeysArray.includes(keyValue)) {
            foreignKeysArray.push(keyValue);
          }
        }
      }
      foreignKeysArray.sort(this.sortAscendant);

      const newRootBranchData = await getNewRootBranchData(keyword, foreignKeysArray);

      expandedData = leftJoin(
        expandedData, (await this.nestData(newRootBranchData, newExpandMatrix)), keyword
      );
    });
  };
  await startNesting();

  return expandedData;
};

module.exports.obtainDataRecord = async (resource, keyName, keyValue) => {
  // Case when we have the resource data stored in a .json file:
  if (config[resource].data) {
    return [searchByKey(keyValue, config[resource].data, keyName)];
  }
  // Case when we have to query the resource data to a third party API:
  if (config[resource].url) {
    try {
      return (await axios.get(`${config[resource].url}?${keyName}=${keyValue}`)).data;
    } catch (e) {
      console.debug(`Error caught in obtaintDataRecord(): ${e}`);
      throw new Error('Error: problem connecting to a third party API.');
    }
  }
  // Here we could add more cases if necessary, like obtaining the resource data from a database.

  return [];
};

module.exports.obtainDataSegment = async (resource, offset, limit) => {
  // Case when we have the resource data stored in a .json file:
  if (config[resource].data) {
    return config[resource].data.slice(offset, offset + limit);
  }
  // Case when we have to query the resource data to a third party API:
  if (config[resource].url) {
    try {
      return (await axios.get(`${config[resource].url}?limit=${limit}&offset=${offset}`)).data;
    } catch (e) {
      console.debug(`Error caught in obtaintDataSegment(): ${e}`);
      throw new Error('Error: problem connecting to a third party API.');
    }
  }
  // Here we could add more cases if necessary, like obtaining the resource data from a database.

  return [];
};

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

const getNewRootBranchData = async (keyword, primaryKeys) => {
  let newRootBranchData;
  if (primaryKeys.length === 0) {
    newRootBranchData = [];
  }
  if (config[config.SOURCES[keyword]].data) {
    newRootBranchData = config[config.SOURCES[keyword]].data.filter(
      (element) => primaryKeys.includes(element[config[config.SOURCES[keyword]].primaryKey])
    );
  } else {
    let url = `${config[config.SOURCES[keyword]].url}?`;
    for (let i = 0; i < primaryKeys.length; i++) {
      if (i === 0) {
        url += `id=${primaryKeys[i]}`;
      } else {
        url += `&id=${primaryKeys[i]}`;
      }
    }
    try {
      newRootBranchData = (await axios.get(`${url}`)).data;
    } catch (e) {
      console.debug(`Error catch in getNewRootBranchData(): ${e}`);
      throw new Error('Error: problem connecting to a third party API.');
    }
  }
  return newRootBranchData;
};

const groupExpands = (expandArray) => {
  const expandGroups = [];
  const expandObject = {};
  for (let i = 0; i < expandArray.length; i++) {
    const keyword = expandArray[i][0];
    if (typeof expandObject[keyword] === 'undefined') {
      expandObject[keyword] = [];
    }
    expandObject[keyword].push(expandArray[i]);
  }
  Object.keys(expandObject).forEach((key) => {
    expandGroups.push(expandObject[key]);
  });
  return expandGroups;
};

const isMatrix2DEmpty = (rootArray) => {
  if ([...rootArray].every((array) => array.length === 0)) {
    return true;
  }
  return false;
};

const leftJoin = (leftData, rightData, keyword) => {
  const leftJoinResult = [];
  for (let e = 0; e < leftData.length; e++) {
    leftJoinResult.push({ ...leftData[e] });
  }
  for (let i = 0; i < leftData.length; i++) {
    const foreignKeyValue = leftData[i][keyword];
    const { primaryKey } = config[config.SOURCES[keyword]];
    if (foreignKeyValue !== null) {
      leftJoinResult[i][keyword] = searchByKey(foreignKeyValue, rightData, primaryKey);
    }
  }
  return leftJoinResult;
};

const searchByKey = (keyValue, dataArray, key = 'id') => {
  let data = null;
  for (let i = 0; i < dataArray.length; i++) {
    // eslint-disable-next-line eqeqeq
    if (dataArray[i][key] == keyValue) { // This double equal sign is on purpose
      data = dataArray[i];
      break;
    }
  }
  return data;
};
