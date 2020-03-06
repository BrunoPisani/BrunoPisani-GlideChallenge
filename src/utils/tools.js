const axios = require('axios');
const config = require('./config.js');

module.exports.sortAscendant = (a, b) => {
  if (a < b) {
    return -1;
  }
  return 1;
};

module.exports.searchByKey = (keyValue, dataArray, key = 'id') => {
  let data = null;
  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i][key] === keyValue) {
      data = dataArray[i];
      break;
    }
  }
  return data;
};

module.exports.nestData = async (rootData, expandMatrix) => {
  console.debug('nestData()');
  console.debug('rootData: ', rootData);
  console.debug('expandMatrix:', expandMatrix);
  let expandedData = [...rootData];

  if (isMatrixEmpty(expandMatrix)) {
    console.debug('empty => return root data');
    return expandedData;
  }
  console.debug('expandMatrix is not empty.');

  const expandBranches = groupExpands(expandMatrix);
  console.debug('expandBranches:', expandBranches);

  const startNesting = async () => {
    await asyncForEach(expandBranches, async (branch) => {
      const keyword = branch[0][0];
      console.debug('--------------------------------------------');
      console.debug('branch keyword:', keyword);
      const newExpandMatrix = branch.map((b) => { b.shift(); return b; });
      console.debug('newExpandMatrix: ', newExpandMatrix);
      const foreignKeysArray = [];

      for (let i = 0; i < rootData.length; i++) {
        let keyValue = rootData[i][keyword];
        console.debug("Bruno", keyValue);
        if (keyValue !== null) {
          console.log("type: ",typeof keyValue);
          console.log(typeof keyValue === 'number');
          console.log('id:', keyValue.id)
          keyValue = (typeof keyValue === 'number') ? keyValue : keyValue.id; 
          console.log('kv: ', keyValue);
          if (!foreignKeysArray.includes(keyValue)) {
            foreignKeysArray.push(keyValue);
          }
        }
      }
      foreignKeysArray.sort(this.sortAscendant);
      console.debug('foreignKeysArray: ', foreignKeysArray);

      const newRootBranchData = await getNewRootBranchData(keyword, foreignKeysArray);
      console.debug('getRootBranchData() => rootBranchData: ', newRootBranchData);

      console.debug('-----------------------------------------------------------------------------------------------');
      console.log("previous leftJoin root data: ", rootData);
      expandedData = leftJoin(
        [...expandedData], (await this.nestData([...newRootBranchData], [...newExpandMatrix])), keyword
      );
      console.log("final root data: ", rootData);
      return expandedData;
    });
  };
  await startNesting();

  // for each branch {
  //   rootData leftjoin nestData(newBranchRootData, newBranchExpandMatrix);
  // }
  // return rootData;

  console.debug('END VALUE:', expandedData);
  return expandedData;
};

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

/*
async function asyncForEach (array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};
*/

const isMatrixEmpty = (rootArray) => {
  if (rootArray.length === 0 || [...rootArray].every((array) => array.length === 0)) {
    return true;
  }
  return false;
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

const getNewRootBranchData = async (keyword, primaryKeys) => {
  let newRootBranchData;
  if (primaryKeys.length === 0) {
    newRootBranchData = [];
  }
  if (config[config.SOURCES[keyword]].data) {
    console.debug('data available');
    newRootBranchData = config[config.SOURCES[keyword]].data.filter(
      (element) => primaryKeys.includes(element[config[config.SOURCES[keyword]].primaryKey])
    );
  } else {
    console.debug('query data');
    let url = `${config[config.SOURCES[keyword]].url}?`;
    for (let i = 0; i < primaryKeys.length; i++) {
      if (i === 0) {
        url += `id=${primaryKeys[i]}`;
      } else {
        url += `&id=${primaryKeys[i]}`;
      }
    }
    newRootBranchData = (await axios.get(`${url}`)).data;
  }
  return newRootBranchData;
};

const leftJoin = (leftData, rightData, keyword) => {
  console.debug('leftJoin() -> keyword: ', keyword);
  console.log('leftJoin() -> leftData:', leftData);
  console.log('leftJoin() -> rightData:', rightData);
  console.log("BRUNO");
  let _leftData = [];
  console.log("BRUNO1");
  for (let e = 0; e < leftData.length; e++) {
    console.log(leftData[e]);
    _leftData.push(Object.assign({}, leftData[e]));
  }
  console.log("BRUNO2");
  for (let i = 0; i < leftData.length; i++) {
    let foreignKeyValue = leftData[i][keyword];
    const { primaryKey } = config[config.SOURCES[keyword]];
    if (foreignKeyValue !== null) {
      foreignKeyValue = (typeof foreignKeyValue === 'number') ? foreignKeyValue : foreignKeyValue[primaryKey]; 
      _leftData[i][keyword] = this.searchByKey(foreignKeyValue, rightData, primaryKey);
    }
  }
  return _leftData;
};

/*
const mayBranchNeed3rdPartyApiQuery = (branch) => {
  let result = false;
  for (let i = 0; i < branch.length; i++) {
    for (let j = 0; j < branch[i].length; j++) {
      if (typeof config[config.SOURCES[branch[i][j]]].url !== 'undefined') {
        result = true;
        break;
      }
    }
    if (result === true) {
      break;
    }
  }
  return result;
};
*/
