const apiRoutes = require('express').Router();

const departments = require('./departments');
const employees = require('./employees');
const offices = require('./offices');

apiRoutes.use('/departments', departments);
apiRoutes.use('/employees', employees);
apiRoutes.use('/offices', offices);
apiRoutes.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to Big Corp API!' });
});

module.exports = apiRoutes;
