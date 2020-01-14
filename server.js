/**
 * @class       : server
 * @author      : theo (theo.j.lincke@gmail.com)
 * @created     : Monday Jan 13, 2020 18:22:08 MST
 * @description : server
 */

const express = require('express');
const app = express();
app.use('/', express.static(__dirname + '/website'));

const path = require('path');
const router = express.Router();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/website/homepage.html'));
});

app.get('/toolpage', (req, res) => {
  res.sendFile(path.join(__dirname + '/website/toolPage.html'));
});

app.get('/specimens', (req, res) => {
  res.sendFile(path.join(__dirname + '/website/the specimens.html'));
});

app.get('/usermanuals', (req, res) => {
  res.sendFile(path.join(__dirname + '/website/usermanuals.html'));
});

app.listen(3000);
