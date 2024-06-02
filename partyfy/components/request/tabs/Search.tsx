import { useState } from "react";
import { BsExplicitFill } from "react-icons/bs";
import { FaPlusCircle } from "react-icons/fa";

import SpotifyLinkBack from "@/components/misc/SpotifyLinkBack";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import { getArtistList } from "@/helpers/SpotifyDataParser";

const Search = ({ you, spotifyAuth, addToQueue, isTemporarySession } : { you: any, spotifyAuth: SpotifyAuth, addToQueue: Function, isTemporarySession: boolean }) => {

    const [searchResults, setSearchResults] = useState([]);
    const [temporarySessionSpotifyAuth, setTemporarySessionSpotifyAuth] = useState<SpotifyAuth | undefined>(undefined);

    async function searchSpotify(searchQuery: string) {
        if (searchQuery.length === 0) {
            setSearchResults([]);
            return;
        } 
        
        let accessToken = null;
        if (isTemporarySession) {
            if (temporarySessionSpotifyAuth === undefined) {
                // Get refresh token from db
                let friendSpotifyAuth = new SpotifyAuth(you.RefreshToken);
                accessToken = await friendSpotifyAuth.getAccessToken();
                setTemporarySessionSpotifyAuth(friendSpotifyAuth);
                // Since state updates are asynchronous, proceed with using the new accessToken
                // for the rest of this function's logic
            } else {
                accessToken = await temporarySessionSpotifyAuth.getAccessToken();
            }
        } else {
            accessToken = await spotifyAuth.getAccessToken();
        }

        const response = await fetch('/api/spotify/search?query=' + searchQuery + '&access_token=' + accessToken);
        const data = await response.json();
        if (!data) return;
        if (!data.tracks.items) return;
        if (data.tracks.items.length === 0) return;
        setSearchResults(data.tracks.items);
    }

    return (
        <>
            <div className="w-full flex flex-col items-center">
                <h4 className="text-2xl my-4">Add Song</h4>
                <input className="input w-3/4 p-2 mt-2" placeholder="Search for a song..." onChange={(e : any) => searchSpotify(e.target.value)}/>
            </div>
            {
                searchResults.length > 0 &&
                <div className="mt-4 w-full flex flex-col items-center">
                    {
                        searchResults.map((result: any, key: number) => {
                            return (
                                <div key={key} className="card p-2 my-2 bg-zinc-900 w-full">
                                    <div className="flex items-center justify-between text-left">
                                        <div className="flex flex-col">
                                            <img className="mt-2" src={result.album.images[2].url} />
                                            <SpotifyLinkBack link={result.external_urls.spotify} />
                                        </div>
                                        <div className="flex flex-col justify-start w-[60%]">
                                            <div className="flex place-items-center">
                                                <h6 className="p-2">{result.name}
                                                    {
                                                        result.explicit &&
                                                        <BsExplicitFill className="inline-block ml-2 mb-1"/>
                                                    }
                                                </h6>
                                            </div>
                                            <h6 className="p-2"><i>{getArtistList(result.artists)}</i></h6>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <button className="btn btn-success" onClick={() => addToQueue(result)}><FaPlusCircle /></button>
                                        </div>
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