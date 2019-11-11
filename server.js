'use strict';
// Built by adapting parts of the following
// https://github.com/codefellows/seattle-301d53/class-10/city-explorer/
// https://github.com/RanVaknin/newrepo08/
// https://github.com/tuckerc/cityExplorer/
// https://github.com/IntensiveLearning94/Lab09-SQLcont
// https://github.com/astrokd/lab-07-back-end

// Global Variables

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

//Database Connection Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
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

//************    Get Location    ************************/
function getLocation(req, res) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${req.query.data}&key=${process.env.GEOCODE_API_KEY}`;

  // Check if search results are in DB
  readFromDB(req.query.data.toLowerCase())
    .then( data => {
      if (data.rowCount > 0) {
        console.log('res send from db');
        res.send(data.rows[0]);
      }
      else {
        // Get data from API
        superagent.get(url)
          .then(data => {
            const geoData = data.body;
            const newLocation = new Location(req.query.data.toLowerCase(), geoData);
            console.log('res send from api');
            res.send(newLocation);
            newLocation.writeToDB()
              .then(writeLocation => console.log('writeLocation',writeLocation.rows[0].id));
          })
          .catch(() => {
            errorHandler('Error in route', req, res);
          });
      }
    })
}

// errors
function notFoundHandler(req, res) {
  res.status(404).send('Not Found');
}

function errorHandler(error, req, res) {
  console.error(error);
  res.status(500).send(error);
}

//Constructor Functions
function Location(query, geoData) {
  this.tablename = 'locations';
  this.search_query = query;
  this.formatted_address = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lng;
}

Location.prototype.writeToDB = function() {
  const SQL = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id;`;
  const values = [this.search_query, this.formatted_address, this.latitude, this.longitude];
  console.log('in writeToDB',this.search_query);
  return client.query(SQL, values);
};

function readFromDB(location) {
  const SQL = `SELECT * FROM locations WHERE search_query=$1;`;
  const values = [location];
  console.log('in readFromDB',values);
  let db = client.query(SQL, values);
  return db;
}