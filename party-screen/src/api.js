
const express = require("express");
const app = express();
var cors = require('cors');

var latest = '6btyEL6NwUa97Nex9cZFvo';

var requested = [];

app.use(cors());


app.listen(8080, () => {
  console.log("App is listening on port 8080!\n");
});

app.get('/update', (req, res) => {
    console.log('Update Requested at ' + new Date());
    let data = {
        progress_ms: parseInt(req.query.progress_ms),
        duration_ms: parseInt(req.query.duration_ms),
        explicit: req.query.explicit == 'true',
        name: req.query.name,
        artist: req.query.artist,
        album: req.query.album,
        album_name: req.query.album_name,
    }
    console.log(data);
    res.send('Success');
    latest = data;
});

app.get('/request', (req, res) => {
    console.log('Request Requested at ' + new Date());
    let data = {
        songid: req.query.id
    }
    requested.push(data);
    res.send({message: "Song requested successfully"});
});

app.get('/latestrequest', (req, res) => {
    if (requested.length > 0) {
        res.send(requested.pop());
    }
    res.send({ message: 'No requests'});
});