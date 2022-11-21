var request = require('request');
var express = require('express');
var app = express();

const client_id = '56b011ba0994424ea55cd9f2205c6439';
const client_secret = 'a1c30414fcd24f5893d8450b0839e290';
const redirect_uri = 'http://72.199.100.227:3000/callback';

app.set('port', process.env.PORT || 3000);

app.get('/login', function(req, res) {
    var scope = 'user-read-playback-state user-read-currently-playing';
  
    res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}`);
});

app.get('/callback', function(req, res) {
    var code = req.query.code || null;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
    };
  
    request.post(authOptions, function(error, response, body) {
        var access_token = body.access_token;
        var refresh_token = body.refresh_token;
  
        var options = {
            url: 'https://api.spotify.com/v1/me/player/currently-playing',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
        };
  
        request.get(options, function(error, response, body) {
            res.send(body)
        });
    });
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
