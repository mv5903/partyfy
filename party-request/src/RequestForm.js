import { useState, useEffect } from "react";
import e from "./assets/e.png";
import swal from '@sweetalert/with-react'

export default function RequestForm() {
    const [results, setResults] = useState([]); 

    const clientID = '56b011ba0994424ea55cd9f2205c6439';
    const redirectURI = 'http://192.168.0.52/';
    const apiURI = 'http://192.168.0.52:8080/';
    const scopes = 'user-read-playback-state user-read-private user-read-email';
    const responseType = 'code';
    const authURL = `https://accounts.spotify.com/authorize?response_type=${responseType}&client_id=${clientID}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectURI)}`;

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
            if (!window.location.href.includes('code')) {
                window.location.href = authURL;
                return;
            }
            let code = window.location.href.split('code=')[1];
            fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(clientID + ':' + 'a1c30414fcd24f5893d8450b0839e290')
                },
                body: new URLSearchParams({
                    'grant_type': 'authorization_code',
                    'code': code,
                    'redirect_uri': redirectURI,
                })
            })
            .then(response => response.json())
            .then(data => {
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
                'Authorization': 'Basic ' + btoa(clientID + ':' + 'a1c30414fcd24f5893d8450b0839e290')
            },
            body: new URLSearchParams({
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            localStorage.setItem('access_token', data.access_token);
        });
    }

    return (
        <div className="Page">
            <div className="RequestForm">
                <h3>Search for a Song:</h3>
                <p>Enter Song and/or Artist</p>
                <input id="title" type="text" placeholder="Song Title" required autoComplete="false" autoCorrect="false"/>
                <input id="artist" type="text" placeholder="Artist" required autoComplete="false" autoCorrect="false"/>
                <button type="button" onClick={search}>Search</button>
            </div>
            <div className="SearchResults">
                {results.length > 0 && <h4 id="results">Results:</h4>}
                {results.map((result) => {
                    return (
                        <div className="result" key={result.uri} id={result.uri}>
                            <div className="flex">
                                <div>
                                    <p>{result.name} {result.explicit ? <img className="e-icon" src={e}></img> : null}</p>
                                    <p>{result.artists[0].name}</p>
                                    <p>{result.album.name}</p>
                                </div>
                                <img src={result.album.images[0].url} />
                            </div>
                            <button type="button" onClick={() => {
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
                                            fetch(`${apiURI}request?id=${result.uri}&fullname=${encodeURIComponent(data.display_name)}&accounturi=${data.uri}&accountimage=${encodeURIComponent(data.images[0].url)}&songname=${encodeURIComponent(result.name)}&songartist=${encodeURIComponent(result.artists[0].name)}&songimg=${encodeURIComponent(result.album.images[0].url)}&explicit=${result.explicit}`)
                                            .then(responseapi => responseapi.json())
                                            .then(reqdata => {
                                                if (reqdata.message) {
                                                    swal("Song Requested!", "Your song has been requested!", "success");
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