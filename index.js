const express = require('express');
const bodyParser = require('body-parser');

// init variables
const app = express();

/**
 * BODYPARSER 
 * @parse application/x-www-form-urlencoded
 * @parse application/json
 */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Start persistan worker component
require('./app/worker/worker');

// Listen requires
const port = process.env.PORT || 3010;

app.listen(port, () => {
  console.log(`Server started at port: ${port}`);
});