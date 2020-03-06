module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    "linebreak-style": 0,
    "global-require": 0,
    "eslint linebreak-style": [0, "error", "windows"],
    "no-underscore-dangle": 0,
    "comma-dangle": 0,
    "no-plusplus": 0,
    "no-use-before-define": 0,
    "no-nested-ternary": 0,
    "no-console": 0,
    "no-await-in-loop": 0,
    "no-param-reassign": 0,
  },
};
