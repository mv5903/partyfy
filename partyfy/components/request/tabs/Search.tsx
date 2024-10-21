import { useState } from "react";
import { FaPlusCircle } from "react-icons/fa";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import { getArtistList } from "@/helpers/SpotifyDataParser";
import ListContentCard, { ListContentCardProps } from "@/components/misc/ListContentCard";

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
        if (!data?.tracks?.items?.length) return;
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
                <div className="mt-4 w-full flex flex-col items-center max-h-[62vh] overflow-auto">
                    {
                        searchResults.map((result: any, key: number) => {

                            const listContentCardProps: ListContentCardProps = {
                                imgSrc: result.album.images[2].url,
                                spotifyLinkBack: result.external_urls.spotify,
                                primaryContent: result.name,
                                secondaryContent: getArtistList(result.artists),
                                explicit: result.explicit,
                                btnOnClick: () => addToQueue(result),
                                btnIcon: <FaPlusCircle />,
                                btnColorClass: 'btn-success',
                            }

                            return <ListContentCard key={key} {...listContentCardProps} />;
                            
                        })
                    }
                </div>
            }
        </>
    );
}

export default Search;