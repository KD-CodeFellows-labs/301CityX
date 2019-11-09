'use strict';

//App Dependencies
const express = require('express');
const cors = require('cors');

//Load environment vars from .env file
require('dotenv').config();

//App Setup
let PORT = process.env.PORT || 3005;
const app = express();
app.use( cors() );

app.listen( PORT, () => console.log(`Listening on port ${PORT}`));

//Route Definitions
app.get('/helloworld', helloWorld);
app.use('*', notFoundHandler);
app.use(errorHandler);

//Handlers
function helloWorld(req, res) {
  res.status(200).send('Hello World!');
}

// errors
function notFoundHandler(req, res) {
  res.status(404).send('Not Found');
}

function errorHandler(error, req, res) {
  console.error(error);
  res.status(500).send(error);
}