import { BsExplicitFill } from "react-icons/bs";
import { useEffect, useState } from "react";

import Swal from 'sweetalert2/dist/sweetalert2.js';
import Loading from "@/components/misc/Loading";
import { fancyTimeFormat } from "@/helpers/Utils";
import SpotifyLinkBack from "@/components/misc/SpotifyLinkBack";
import { Users } from "@prisma/client";
import { UserProfile } from "@auth0/nextjs-auth0/client";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import LoadingDots from "@/components/misc/LoadingDots";

const TheirSession = ({ you, friendSpotifyAuth, friend } : { you: UserProfile, friendSpotifyAuth: SpotifyAuth, friend: Users }) => {

    const [queue, setQueue] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nowPlaying, setNowPlaying] = useState(null);

    async function showQueueDisclaimer() {
        await Swal.fire({
            html: 
            `
            <p>Please be aware that Partyfy uses Spotify's "Get The User's Queue" API, which currently does not differentiate between your manually curated queue and Spotify's 'Next From' recommendations. This limitation prevents us from distinguishing the tracks you've personally queued from those recommended by Spotify. However, your friend's queue will always appear first, despite this limitation. We appreciate your understanding as we continue to provide the best possible Partyfy experience within these constraints.</p>
            `
        });
    }

    async function showFullQueue() {
        let accessToken = await friendSpotifyAuth.getAccessToken();
        if (!accessToken) return;
        const response = await fetch('/api/spotify/queue?access_token=' + accessToken);
        const data = await response.json();
        if (data && data.queue) {
            setIsLoading(false);
            setQueue(data.queue);
        }
    }

    async function showNowPlaying() {
        try {
            let accessToken = await friendSpotifyAuth.getAccessToken();
            if (!accessToken) return;
            const response = await fetch('/api/spotify/nowplaying?access_token=' + accessToken);
            const data = await response.json();
            console.log(data);
            if (data) {
                setIsLoading(false);
                setNowPlaying(data);
            }
        } catch (e) {}
    }

    useEffect(() => {
        const interval = setInterval(showNowPlaying, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        showFullQueue();
        const interval = setInterval(showFullQueue, 2000);
        return () => clearInterval(interval);
    }, []);


    return (
        <div>
            {
                queue.length > 0 
                ?
                <div className="w-full">
                    <h5 className="mt-2 text-lg">Their Session</h5>
                    <div className="flex flex-col items-center">
                        <h3 className="text-3xl">Now Playing</h3>
                        { 
                            nowPlaying 
                            ?                            
                            <>
                                <div className="card p-2 my-2 flex justify-center w-ful">
                                    <div className="flex gap-2">
                                        <div className="flex flex-col">
                                            {
                                                nowPlaying.currently_playing_type == 'track'
                                                ?
                                                <img className="me-4" src={nowPlaying.item.album.images[0].url} style={{ width: '75px', height: '75px' }} />
                                                :
                                                nowPlaying.item
                                                ?
                                                <img className="me-4" src={nowPlaying.item.images[0].url} style={{ width: '75px', height: '75px' }} />
                                                :
                                                <img className="me-4" src={"https://www.freeiconspng.com/uploads/spotify-icon-2.png"} style={{ width: '75px', height: '75px' }} />
                                            }
                                            {
                                                nowPlaying.item &&
                                                <SpotifyLinkBack link={nowPlaying.item.external_urls.spotify} />
                                            }
                                        </div>
                                        <div className="flex flex-col items-start justify-between w-full px-2">
                                            <div className="flex justify-start">
                                                {
                                                    nowPlaying.item 
                                                    ?
                                                    <h6 className="text-left"><strong>{nowPlaying.item.name}</strong></h6>
                                                    :
                                                    <h6 className="text-left"><strong>Uknown {nowPlaying.currently_playing_type == 'episode' ? "(Podcasts not supported)" : ""}</strong></h6>
                                                }
                                                { nowPlaying.item && nowPlaying.item.explicit === true ? <BsExplicitFill className="mt-1 ms-2"/> : ''}
                                            </div>
                                                {
                                                    nowPlaying.item
                                                    ?
                                                    <h6 className="text-left"><i>{nowPlaying.item.artists[0].name}</i></h6>
                                                    :
                                                    <h6 className="text-left"><i>Unknown artist</i></h6>
                                                }
                                            <div className="flex justify-between w-full">
                                                <h6>{fancyTimeFormat(nowPlaying.progress_ms)}</h6>
                                                {
                                                    nowPlaying.item
                                                    ?
                                                    <h6>{fancyTimeFormat(nowPlaying.item.duration_ms)}</h6>
                                                    :
                                                    <h6>?</h6>
                                                }
                                            </div>
                                            <progress className="progress progress-flat-primary w-full" value={nowPlaying.progress_ms} max={nowPlaying.item ? nowPlaying.item.duration_ms : ''}></progress>
                                        </div>
                                    </div>
                                </div>
                            </>
                            :
                            <LoadingDots className="m-16" />
                        }
                    </div>
                    <h4 className="mt-2 text-2xl">Up Next</h4>
                    <h6 className="text-gray-600 mt-2" onClick={() => showQueueDisclaimer()}>Why is the queue inaccurate?</h6>
                    <table className="table table-dark mt-3 w-full">
                        <tbody>
                            {
                                queue.map((item: any, index: number) => {
                                    return (
                                        <tr key={index}>
                                            <th scope="row">{index + 1}</th>
                                            <td>
                                                <div className="flex items-center justify-between">
                                                    <img className="me-2" src={item.type == 'track' ? item.album.images[2].url : item.images[0].url} style={{ width: '50px', height: '50px' }} />    
                                                    <div className="w-2/3">
                                                        <div className="flex justify-start">
                                                            <h6 className="whitespace-normal w-3/4"><strong>{item.name}</strong></h6>
                                                            {item.explicit === true ? <BsExplicitFill className="mt-1 ms-2"/> : ''}
                                                        </div>
                                                        <h6 className="whitespace-normal"><i>{item.type == 'track' ? item.artists[0].name : item.show.name}</i></h6> 
                                                    </div>
                                                    <SpotifyLinkBack link={item.external_urls.spotify} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })

                            }
                        </tbody>
                    </table>
                </div>
                :
                <>
                    {
                        isLoading
                        ?
                        <div className="mt-4">
                            <Loading  />
                        </div>
                        :
                        <>
                            <h3 className="text-center mt-4">No active Spotify session.</h3>
                            <h3 className="text-center mt-4">{`If ${friend.Username} is listening to a local file, their session will not appear here.`}</h3>
                        </>
                    }
                </>
            }
        </div>
    );
}

export default TheirSession;