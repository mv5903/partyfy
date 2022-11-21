import { useState, useEffect } from "react";
import e from "./assets/e.png";
import swal from '@sweetalert/with-react'

export default function RequestForm() {
    const [results, setResults] = useState([]); 

    const clientID = '56b011ba0994424ea55cd9f2205c6439';
    const redirectURI = encodeURIComponent('http://192.168.0.37:3000/callback');
    const scopes = 'user-read-playback-state';
    const responseType = 'code';
    const authURL = `https://accounts.spotify.com/authorize?response_type=${responseType}&client_id=${clientID}&scope=${scopes}&redirect_uri=${redirectURI}`;

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
                    'redirect_uri': 'http://192.168.0.37:3000/callback',
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

    function search() {
        let access_token = localStorage.getItem('access_token');
        let title = document.getElementById('title').value;
        let artist = document.getElementById('artist').value;
        let query = `https://api.spotify.com/v1/search?q=${title}%20${artist}&type=track&limit=10`;
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
            if (!data || data == null || data == undefined) {
                console.log("Fetching new access token");
                fetchNewAccessToken();
            } else {
                setResults(data.tracks.items);
            }
        });
    }

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
                <input id="title" type="text" placeholder="Song Title" required/>
                <input id="artist" type="text" placeholder="Artist" required/>
                <button type="button" onClick={search}>Search</button>
            </div>
            <div className="SearchResults">
                <h4 id="results">Results:</h4>
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
                                        swal("Song Requested!", "Your song has been requested!", "success");
                                        fetch('http://192.168.0.37:8080/request?id=' + result.uri)
                                        .then(response => response.json())
                                        .then(data => {
                                            console.log(data);
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