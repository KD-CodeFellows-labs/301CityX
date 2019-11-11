'use strict';
// Built by adapting parts of the following
// https://github.com/codefellows/seattle-301d53/class-10/city-explorer/
// https://github.com/RanVaknin/newrepo08/
// https://github.com/tuckerc/cityExplorer/
// https://github.com/IntensiveLearning94/Lab09-SQLcont
// https://github.com/astrokd/lab-07-back-end

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
      console.log('then',data);
      if (data.rowCount > 0) {
        res.send(data.rows[0]);
      }
      else {
        superagent.get(url)
          .then(data => {
            const geoData = data.body;
            const newLocation = new Location(req.query.data.toLowerCase(), geoData);
            res.send(newLocation);
            // locations[url] = newLocation;
            // console.log(newLocation);
            newLocation.writeToDB()
              .then(writeLocation => console.log('writeLocation',writeLocation));
          })
          .catch(() => {
            errorHandler('Error in route', req, res);
          });
      }
    })

  // if (locations[url]) {
  //   // res.send(locations[url]);
  //   // console.log('locations from memory');
  // }
  // else {
  //   // console.log('superagent get',req.query.data);
  //   superagent.get(url)
  //     .then(data => {
  //       const geoData = data.body;
  //       const newLocation = new Location(req.query.data.toLowerCase(), geoData);
  //       locations[url] = newLocation;
  //       // console.log(newLocation);
  //       newLocation.writeToDB()
  //         .then(newLocation => res.send(newLocation));
  //     })
  //     .catch(() => {
  //       errorHandler('Error in route', req, res);
  //     });
  //   //write to db
  // }
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
  // console.log('in writeToDB');
  return client.query(SQL, values);
  // .then(result => {
  //   // console.log(result);
  //   this.id = result.rows[0].id;
  //   console.log('then writeToDB',this.search_query,result);
  //   return this;
  // });
};

// Location.prototype.readFromDB = function(location) {
function readFromDB(location) {
  const SQL = `SELECT * FROM locations WHERE search_query=$1;`;
  // console.log('location.query',location.query);
  const values = [location];
  console.log('in readFromDB',values);
  let db = client.query(SQL, values);
  // console.log('db',db);
  return db;
  // .then(result => {
  //   console.log('then readFromDB',result.rows[0]);
  // })
}