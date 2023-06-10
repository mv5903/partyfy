import { FaPlusCircle } from "react-icons/fa";
import { BsExplicitFill } from "react-icons/bs";
import {  useState } from "react";

import Swal from "sweetalert2";

const Search = ({ you, spotifyAuth, addToQueue } : { you: any, spotifyAuth: any, addToQueue: Function }) => {

    const [searchResults, setSearchResults] = useState([]);

    async function searchSpotify(searchQuery: string) {
        if (searchQuery.length === 0) {
            setSearchResults([]);
            return;
        } 
        let accessToken = await spotifyAuth.getAccessToken();
        const response = await fetch('/api/spotify/search?query=' + searchQuery + '&access_token=' + accessToken);
        if (!response.ok) {
            Swal.fire({
                title: 'Error',
                text: 'An error occurred while searching for songs, response: ' + response.statusText + '. Please try again later. Spotify Authentication Information: ' + spotifyAuth.toString(),
                icon: 'error',
            })
        }
        const data = await response.json();
        if (!data) return;
        if (!data.tracks ) {
            Swal.fire({
                title: 'Error',
                text: 'An error occurred while searching for songs, response: ' + JSON.stringify(data) + '. Please try again later. Spotify Authentication Information: ' + spotifyAuth.toString(),
                icon: 'error',
            })
        }
        if (!data.tracks.items) return;
        if (data.tracks.items.length === 0) return;
        setSearchResults(data.tracks.items);
    }


    return (
        <>
            <div>
                <h4 className="text-center mt-4">Add Song</h4>
                <div className="d-flex flex-row justify-content-center">
                    <input className="form-control w-75" placeholder="Search for a song..." onChange={(e : any) => searchSpotify(e.target.value)}/>
                </div>
            </div>
            {
                searchResults.length > 0 &&
                <div className="d-flex flex-column justify-content-center align-items-center mt-4">
                    {
                        searchResults.map((result: any, key: number) => {
                            return (
                                <div key={key} className="card p-2 m-2 bg-dark w-100">
                                    <div className="d-flex flex-row align-items-center justify-content-between">
                                        <img src={result.album.images[2].url} />
                                        <div className="d-flex flex-column justify-content-start">
                                            <div className="d-flex">
                                                <h6 className="p-2">{result.name}</h6>
                                                {
                                                    result.explicit &&
                                                    <h6 className="mt-2"><BsExplicitFill/></h6>
                                                }
                                            </div>
                                            <h6 className="p-2"><i>{result.artists[0].name}</i></h6>
                                        </div>
                                        <button className="btn btn-success" onClick={() => addToQueue(result)}><FaPlusCircle /></button>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            }
        </>
    );
}

export default Search;