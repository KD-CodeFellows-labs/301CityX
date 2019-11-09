'use strict';
// Global Variables
let locations = {};

//App Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

//Load environment vars from .env file
require('dotenv').config();

//App Setup
let PORT = process.env.PORT || 3005;
const app = express();
app.use( cors() );

//Database Setup
const client = new pg.Client(process.env.DATABASE_URL);

client.on('error', err => console.log(err));

//Listen for requests
app.listen( PORT, () => console.log(`Listening on port ${PORT}`));

//Route Definitions
app.get('/helloworld', helloWorld);
app.get('/location',getLocation);
app.use('*', notFoundHandler);
app.use(errorHandler);



//Handlers
function helloWorld(req, res) {
  res.status(200).send('Hello World!');
}

function getLocation(req, res) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${req.query.data}&key=${process.env.GEOCODE_API_KEY}`;

  console.log('[url]',[url]);

  if (locations[url]) {
    res.send(locations[url]);
    console.log('locations',locations[url]);
  }
  else {
    console.log(req.query.data);
    superagent.get(url)
      .then(data => {
        const geoData = data.body;
        const newLocation = new Location(req.query.data, geoData);
        locations[url] = newLocation;
        res.send(newLocation);
      })
      .catch(() => {
        errorHandler('Error in route', req, res);
      });
  }
}


// errors
function notFoundHandler(req, res) {
  res.status(404).send('Not Found');
}

function errorHandler(error, req, res) {
  console.error(error);
  console.error(req.query.data);
  res.status(500).send(error);
}

//Constructor Functions
function Location(query, geoData) {
  this.search_query = query;
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lng;
}
