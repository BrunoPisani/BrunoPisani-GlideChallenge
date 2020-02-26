const config = require('./config.js');
const axios = require('axios');

module.exports.sortAscendant = (a, b) => {
  if (a < b) {
    return -1;
  }
  return 1;
};

module.exports.searchById = (foreignKey, rightData) => {
  let value = null;
  for(let i = 0; i < rightData.length; i++) {
    if(rightData[i].id === foreignKey){
      value = rightData[i];
      break;
    }
  }
  return value;
};

module.exports.nestData = async (rootData, expandMatrix) => {
  console.log('nestData()');
  console.log('rootData: ', rootData);
  console.log('expandMatrix:', expandMatrix);

  if (isMatrixEmpty(expandMatrix)) {
    console.log('empty => return root data');
    return rootData;
  }
  console.log('expandMatrix is not empty.');
  
  const expandBranches = groupExpands(expandMatrix);
  console.log('expandBranches:', expandBranches);

  const startNesting = async () => {
    await asyncForEach(expandBranches, async (branch) => {
      const keyword = branch[0][0];
      console.log('--------------------------------------------');
      console.log("branch keyword:", keyword);
      const newExpandMatrix = branch.map(b => {b.shift(); return b;});
      console.log("newExpandMatrix: ", newExpandMatrix);
      const primaryKeysArray = [];

      for(let i = 0; i < rootData.length; i++) {
        let id = rootData[i][keyword];
        if(id !== null) {
          if(!primaryKeysArray.includes(id)) {
            primaryKeysArray.push(id);
          }
        }
      }
      primaryKeysArray.sort(this.sortAscendant);
      console.log('primaryKeysArray: ', primaryKeysArray);

      let newRootBranchData = await getRootBranchData(keyword, primaryKeysArray);
      console.log('getRootBranchData() => rootBranchData: ', newRootBranchData);

      console.log('-------------------------------------------------------------------------------------------------');
      //console.log('BRANCH: ' + keyword + ': ', this.nestData(newRootBranchData, newExpandMatrix));
      rootData = leftJoin(rootData, (await this.nestData(newRootBranchData, newExpandMatrix)), keyword);
      return rootData;
    });
  }
  await startNesting();

   // for each branch {
  //   rootData leftjoin nestData(newBranchRootData, newBranchExpandMatrix);
  // }
  // return rootData;

  console.log('END VALUE:', rootData);
  return rootData;
  
};

async function asyncForEach (array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

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

const getRootBranchData = async (keyword, primaryKeys) => {
  let rootBranchData;
  if (primaryKeys.length === 0) {
    rootBranchData = [];
  }
  if (config[config.SOURCES[keyword]].data) {
    console.log('data available');
    rootBranchData = config[config.SOURCES[keyword]].data.filter((element) => primaryKeys.includes(element[config[config.SOURCES[keyword]].primaryKey]));
  } else {
    console.log('query data');
    let url = config[config.SOURCES[keyword]].url + '?';
    for (let i = 0; i < primaryKeys.length; i++) {
      if (i === 0) {
        url += 'id=' + primaryKeys[i];
      } else {
        url += '&id=' + primaryKeys[i] ;
      }
    }
    rootBranchData = (await axios.get(`${url}`)).data;
  }
  return rootBranchData;
}

const leftJoin = (leftData, rightData, keyword) => {
  console.log('leftJoin() -> keyword: ', keyword);
  for(let i = 0; i < leftData.length; i++) {
    const foreignId = leftData[i][keyword];
    if(foreignId !== null) {
      leftData[i][keyword] = this.searchById(foreignId, rightData);
    }
  }
  return leftData;
};

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
