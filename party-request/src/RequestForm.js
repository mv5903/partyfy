import { useState, useEffect } from "react";
import { SECRETS } from "./assets/secrets";
import e from "./assets/e.png";
import swal from '@sweetalert/with-react'

export default function RequestForm() {
    const authURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SECRETS.clientID}&scope=${SECRETS.scopes}&redirect_uri=${encodeURIComponent(SECRETS.redirectURI)}`;

    const [results, setResults] = useState([]);
    /**
     * When a user loads the webpage for the first time, they will be redirected to the Spotify login page.
     * 
     * Spotify authentication is required to access the public directory of songs, and is used to prevent
     * abuse of the service (i.e. spamming the queue with songs).
     * 
     * The user will automatically be redirected to this page after logging in, and will automatically request
     * an access_token and refresh_token from the Spotify API.
     * 
     * If the access token expires, the refresh token will be used to request a new access token.
     */
    useEffect(() => {
        if (!localStorage.getItem('access_token') || localStorage.getItem('access_token') === 'undefined')  { 
            // If the user has not logged in yet, redirect them to the Spotify login page. 
            if (!window.location.href.includes('code')) {
                swal({
                    content: (
                    <div className="popup left-popup">
                        <h2>Notice</h2>
                        <p>You are about to be redirected to the Spotify Login Page. Log in with your own Spotify account. By proceeding you are aware that:</p>
                        <ul>
                            <li>Your login information is not stored anywhere and is only used to generate an access token.</li>
                            <li>The access token is stored in your web browser's local storage and is only used to make requests to the Spotify Song Search API.</li>
                            <li>The access token is only stored on your phone and expires after 1 hour. A new token will automatically be regenerated should the old one expire. This does not require you to log in again.</li>
                            <li>Your name, username, and account photo is collected solely for the popup displayed when you request a song and is not stored anywhere. It is also used to ensure you do not go over the rate limit.</li>
                            <li>There is a rate limit of 10 songs for every 1 hour time period. Should you go over this limit, you will see an error message.</li>
                        </ul>
                    </div>)
                })
                .then(data => {
                    window.location.href = authURL;
                    return;
                })
            }
            // If the user has logged in, request an access token and refresh token from the Spotify API, based on the code provided in the URL.
            let code = window.location.href.split('code=')[1];
            fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(SECRETS.clientID + ':' + SECRETS.clientSecret)
                },
                body: new URLSearchParams({
                    'grant_type': 'authorization_code',
                    'code': code,
                    'redirect_uri': SECRETS.redirectURI,
                })
            })
            .then(response => response.json())
            .then(data => {
                // Store the access token and refresh token in local storage.
                if (data.access_token) {
                    console.log(data);
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);
                }
            });
        }
    }, []);


    /**
     * When the user submits a search query, the Spotify API is queried for the search results.
     * If the results come back with an error, it is assumed that the access token has expired, which
     * will trigger a refresh token request.
     */
    function search() {
        let access_token = localStorage.getItem('access_token');
        let title = document.getElementById('title').value;
        let artist = document.getElementById('artist').value;
        let query = `https://api.spotify.com/v1/search?q=${encodeURIComponent(title)}%20${encodeURIComponent(artist)}&type=track&limit=10`;
        fetch(query, {
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Authorization": "Bearer " + access_token,
                "Content-Type": "application/json"
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Search data', data);
            // Need to generate new access token if expired
            if (!data || data == null || data == undefined || data.error) {
                console.log("Fetching new access token");
                fetchNewAccessToken();
            } else {
                setResults(data.tracks.items);
            }
        });
    }

    /**
     * When the user's access token expires, a new access token is requested using the refresh token with this function.
     */
    function fetchNewAccessToken() {
        const refresh_token = localStorage.getItem('refresh_token');
        fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(SECRETS.clientID + ':' + SECRETS.clientSecret)
            },
            body: new URLSearchParams({
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Fetched new access token.');
            localStorage.setItem('access_token', data.access_token);
        });
    }

    return (
        <div className="Page">
            <div className="RequestForm">
                <h4 className="display-4 mt-4">Search for a Song:</h4>
                <p className="text-muted">Enter Song and/or Artist</p>
                <input id="title" type="text" placeholder="Song Title" className="form-control" autoComplete="false" autoCorrect="false"/>
                <input id="artist" type="text" placeholder="Artist" className="form-control" autoComplete="false" autoCorrect="false"/>
                <button type="button" className="btn btn-primary" onClick={search}>Search</button>
            </div>
            <div className="SearchResults">
                {results.length > 0 && <h4 id="results" className="display-4 mt-4">Results:</h4>}
                {results.map((result) => {
                    return (
                        <div className="result card text-dark bg-secondary" key={result.uri} id={result.uri}>
                            <div className="flex">
                                <div>
                                    <p className="mt-4"><strong>{result.name} {result.explicit ? <img className="e-icon ms-1" src={e}></img> : null}</strong></p>
                                    <p className="lead">{result.artists[0].name}</p>
                                    <p className="text">{result.album.name}</p>
                                </div>
                                <img src={result.album.images[0].url} />
                            </div>
                            <button type="button" className="btn btn-success mb-2" onClick={() => {
                                swal({
                                    content: (<div>
                                        <h3>Are you sure you want to request this song?</h3>
                                        <div className="flex">
                                            <div className="popup-text">
                                                <p>{result.name} {result.explicit ? <img className="e-icon" src={e}></img> : null}</p>
                                                <p>{result.artists[0].name}</p>
                                                <p>{result.album.name}</p>
                                            </div>
                                            <img className="popup-image" src={result.album.images[0].url}></img>
                                        </div>
                                    </div>),
                                    buttons: {
                                        cancel: "Cancel",
                                        confirm: "Confirm"
                                    }
                                })
                                .then((value) => {
                                    if (value) {
                                        // Get information about the user that requested the song
                                        const access_token = localStorage.getItem('access_token');
                                        fetch("https://api.spotify.com/v1/me", {
                                            headers: {
                                                "Accept": "application/json",
                                                "Authorization": "Bearer " + access_token,
                                                "Content-Type": "application/json"
                                            }
                                        })
                                        .then(response => response.json())
                                        .then(data => {
                                            if (!data.uri) {
                                                fetchNewAccessToken();
                                            }
                                            fetch(`${SECRETS.apiURI}request?id=${result.uri}&fullname=${encodeURIComponent(data.display_name)}&accounturi=${data.uri}&accountimage=${encodeURIComponent(data.images[0].url)}&songname=${encodeURIComponent(result.name)}&songartist=${encodeURIComponent(result.artists[0].name)}&songimg=${encodeURIComponent(result.album.images[0].url)}&explicit=${result.explicit}`)
                                            .then(responseapi => responseapi.json())
                                            .then(reqdata => {
                                                if (reqdata.message) {
                                                    swal("Song Requested!", "Your song has been requested!", "success");
                                                } else {
                                                    swal("Error", "There was an error requesting your song. Please try again.", "error");
                                                }
                                                console.log(reqdata);
                                            });
                                        });
                                    }
                                });
                            }}>Request</button>
                        </div>
                    );
                })}
            </div>
        </div>
    )

    
}