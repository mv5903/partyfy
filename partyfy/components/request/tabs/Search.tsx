import { FaPlusCircle } from "react-icons/fa";
import { BsExplicitFill } from "react-icons/bs";
import { useState } from "react";

import SpotifyLinkBack from "@/components/misc/SpotifyLinkBack";
import { Users } from "@prisma/client";
import { UserProfile } from "@auth0/nextjs-auth0/client";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";

const Search = ({ you, spotifyAuth, addToQueue } : { you: UserProfile, spotifyAuth: SpotifyAuth, addToQueue: Function }) => {

    const [searchResults, setSearchResults] = useState([]);

    async function searchSpotify(searchQuery: string) {
        if (searchQuery.length === 0) {
            setSearchResults([]);
            return;
        } 
        let accessToken = await spotifyAuth.getAccessToken();
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
                                                <h6 className="p-2">{result.name}</h6>
                                                {
                                                    result.explicit &&
                                                    <h6><BsExplicitFill/></h6>
                                                }
                                            </div>
                                            <h6 className="p-2"><i>{result.artists[0].name}</i></h6>
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