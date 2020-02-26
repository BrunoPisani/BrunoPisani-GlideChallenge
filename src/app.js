const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const apiRoutes = require('./routes');
const websiteRoutes = require('./routes/website');

app.use('/api', apiRoutes);
app.get('/', websiteRoutes);

app.listen(port, () => {
  console.log(`Running on port ${port}`);
});
