var express = require('express');
var app = express();
var path = require('path');

// Make files in /static accessible
app.use('/', express.static(__dirname + '/static'));

// viewed at http://localhost:5000
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/static/index.html'));
});

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
