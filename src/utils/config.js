const departments = require('../resources/departments.json');
const offices = require('../resources/offices.json');

const EMPLOYEES_QUERY_URL = 'https://rfy56yfcwk.execute-api.us-west-1.amazonaws.com/bigcorp/employees';

const config = {
  DEFAULT_OFFSET: 0,
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 1000,
  DEPARTMENTS: {
    data: departments,
    expand_regex: /^superdepartment(\.superdepartment)*$/,
    url: undefined,
    primaryKey: 'id'
  },
  EMPLOYEES: {
    data: undefined,
    expand_regex: /^(manager(\.manager)*(\.department(\.superdepartment)*|\.office)*|department(\.superdepartment)*|office)$/,
    url: EMPLOYEES_QUERY_URL,
    primaryKey: 'id'
  },
  OFFICES: {
    data: offices,
    expand_regex: undefined,
    url: undefined,
    primaryKey: 'id'
  },
  SOURCES: {
    department: 'DEPARTMENTS',
    manager: 'EMPLOYEES',
    office: 'OFFICES',
    superdepartment: 'DEPARTMENTS'
  }
};

module.exports = config;
