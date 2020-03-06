const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const apiRoutes = require('./routes/api');
const websiteRoutes = require('./routes/website');

app.use('/api', apiRoutes);
app.use('/', websiteRoutes);

app.listen(port, () => {
  /* eslint-disable-line no-console */
  console.debug(`Running on port ${port}`);
});
