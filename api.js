const express = require("express");
const app = express();
var cors = require('cors');

var latest = '';

var requested = [];

app.use(cors());


app.listen(8080, () => {
  console.log("App is listening on port 8080!\n");
});

///////////////////////////////////////////////////////////////////////////////
// THIS SECTION IS USED EXPCILITY FOR NODE RED ONLY
///////////////////////////////////////////////////////////////////////////////

/**
 * Updates that get sent from Node-Red to the party screen application in order to udpate
 * the status of the progress bar and the current song playing.
 */
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

/**
 * Used by Node-REd to get the latest song from the queue and process it with
 * the Spotify API.
 */

 app.get('/latestrequest', (req, res) => {
    if (requested.length > 0 && !requested[0].queued) {
        let itemToQueue = requested[0];
        itemToQueue.queued = true;
        res.send(itemToQueue);
    }
    res.send({ message: 'No requests'});
});

///////////////////////////////////////////////////////////////////////////////
// THIS SECTION IS USED EXPLICITLY FOR THE REQUEST FORM ONLY
///////////////////////////////////////////////////////////////////////////////

/**
 * Used by the Request Form application to request a song into the server queue.
 * This gets picked up by Node-Red within a few seconds.
 */

app.get('/request', (req, res) => {
    console.log('Request Requested at ' + new Date());
    let data = {
        songid: req.query.id,
        songname: req.query.songname,
        songartist: req.query.songartist,
        songimg: req.query.songimg,
        explicit: req.query.explicit == 'true',
        fullname: req.query.fullname,
        accounturi: req.query.accounturi,
        accountimage: req.query.accountimage,
        queued: false
    }
    requested.push(data);
    res.send({message: "Song requested successfully"});
});

///////////////////////////////////////////////////////////////////////////////
// THIS SECTION IS USED EXPLICITLY FOR THE PARTY SCREEN ONLY
///////////////////////////////////////////////////////////////////////////////

/**
 * Accessed by the api to access the latest current song playing information
 */
app.get('/latest', (req, res) => {
    res.send(latest);
})

/**
 *  Accessed by the api to see if there is a queue alert to display
 */
app.get('/latestqueue', (req, res) => {
    if (requested[0] && requested[0].queued) {
        res.send(requested.pop());
    }
    res.send({ message: "No requests" });
});

///////////////////////////////////////////////////////////////////////////////
// THIS SECTION IS USED FOR TESTING PURPOSES ONLY
///////////////////////////////////////////////////////////////////////////////
