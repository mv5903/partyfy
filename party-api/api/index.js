import express from "express";
const app = express();
import cors from 'cors';
import { SECRETS } from "./secrets.js";
import { DB } from './db.js';
import { Song } from './song.js';
import path from 'path';
const __dirname = path.resolve(path.dirname(''));
app.use(express.static(__dirname + '/external'));

let latest = {
    progress_ms: 0,
    duration_ms: 0,
};

const requested = [];

app.use(cors());

// Used to update the song progress without needing to constantly query the Spotify API
let interval;
function setUpdateInterval() {
    if (interval) {
        clearInterval(interval);
    }
    const updateInterval = 250;
    interval = setInterval(() => {
        // Make sure the progress doesn't exceed the total duration
        if (latest.progress_ms + updateInterval <= latest.duration_ms) {
            latest.progress_ms += updateInterval;
        }
    }, updateInterval);
}

app.listen(8080, () => {
  console.log("App is listening on port 8080!\n");
});

app.get('/', (_req, res) => {
    res.redirect('/latest')
})

///////////////////////////////////////////////////////////////////////////////
// THIS SECTION IS USED EXPCILITY FOR NODE RED ONLY
///////////////////////////////////////////////////////////////////////////////

/**
 * Updates that get sent from Node-Red to the party screen application in order to udpate
 * the status of the progress bar and the current song playing.
 */
app.get('/update', (req, res) => {
    console.log('Update Requested at ' + new Date());
    const data = {
        progress_ms: parseInt(req.query.progress_ms),
        duration_ms: parseInt(req.query.duration_ms),
        explicit: req.query.explicit,
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

 app.get('/latestrequest', (_req, res) => {
    if (requested && requested.length > 0) {
        if (requested.length > 0 && !requested[0].queued) {
            const itemToQueue = requested[0];
            itemToQueue.queued = true;
            res.send(itemToQueue);
        }
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
    const data = {
        songid: req.query.id,
        songname: req.query.songname,
        songartist: req.query.songartist,
        songimg: req.query.songimg,
        explicit: req.query.explicit,
        fullname: req.query.fullname,
        accounturi: req.query.accounturi,
        accountimage: req.query.accountimage,
        queued: false
    }
    requested.push(data);
    const database = new DB();
    
    res.send({message: "Song requested successfully"});
});

///////////////////////////////////////////////////////////////////////////////
// THIS SECTION IS USED EXPLICITLY FOR THE PARTY SCREEN ONLY
///////////////////////////////////////////////////////////////////////////////

/**
 * Accessed by the api to access the latest current song playing information
 */
app.get('/latest', (_req, res) => {
    setUpdateInterval();
    res.send(latest);
})

/**
 *  Accessed by the api to see if there is a queue alert to display
 */
app.get('/latestqueue', (_req, res) => {
    if (requested[0] && requested[0].queued) {
        res.send(requested.pop());
    }
    res.send({ message: "No requests" });
});

///////////////////////////////////////////////////////////////////////////////
// THIS SECTION IS USED FOR TESTING PURPOSES ONLY
///////////////////////////////////////////////////////////////////////////////
import fetch from 'node-fetch';

let access_token = '';
let refresh_token = '';

app.get('/controlpanel', (req, res) => {
    if (refresh_token === '' || access_token === '') {
        res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${SECRETS.clientID}&scope=${SECRETS.scopes}&redirect_uri=${encodeURIComponent(SECRETS.redirectURI)}`);
        const code = req.query.code;
        if (SECRETS.redirectURI) {
                fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(SECRETS.clientID + ':' + SECRETS.clientSecret)
                },
                body: 'grant_type=authorization_code&code=' + code + '&redirect_uri=' + encodeURIComponent(SECRETS.redirectURI)
            })
            .then(response => response.json())
            .then((data) => {
                if (data.access_token) {
                    access_token = data.access_token;
                    refresh_token = data.refresh_token;
                }
            })
            .catch(error => {
                console.log(error);
            })
        }
        
    } else {
        res.redirect('/controlpanel/home');
    }
});

app.get('/controlpanel/home', (req, res) => {
    res.sendFile(__dirname + '/home.html');
});

app.get('/controlpanel/getalltables', (req, res) => {
    const database = new DB();
    database.connect().then(() => {
        database.getAllTables().then((data) => {
            res.send(data);
        });
    })
});

app.get('/controlpanel/addToPlayed', (req, res) => {
    const database = new DB();
    const song = new Song(req.query.id, req.query.albumart, req.query.name, req.query.artists, req.query.album, req.query.explicit, parseInt(req.query.duration_ms));
    database.connect().then(() => {
        database.addSongPlayed(song).then((response) => {
            res.send({message: 'Success'});
        });
    });
});

app.get('/controlpanel/getspotifylatest', (req, res) => {
    fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {
            "Accept": "application/json",
            "Authorization": "Bearer " + access_token,
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then((data) => {
        res.send(data);
    })
    .catch(error => {
        console.log(error);
    })
})

app.get('/controlpanel/clear', (req, res) => {
    const database = new DB();
    database.connect().then(() => {
        database.clearTable(req.query.table).then((response) => {
            res.send({message: 'Success'});
        });
    });
});

app.get('/controlpanel/updateNowPlaying', (req, res) => {
    const database = new DB();
    const song = new Song(req.query.id, req.query.albumart, req.query.name, req.query.artists, req.query.album, req.query.explicit, parseInt(req.query.duration_ms));
    let songJSON = song.toJSON();
    songJSON['progress_ms'] = parseInt(req.query.progress_ms);
    database.connect().then(() => {
        database.updateNowPlaying(songJSON).then((response) => {
            res.send({message: 'Success'});
        });
    });
});

app.get('/controlpanel/getLatest', (req, res) => {
    const database = new DB();
    database.connect().then(() => {
        database.getNowPlaying().then((data) => {
            res.send(data);
        });
    });
});


// pm2 start index.js --cron-restart="0 0 * * *"