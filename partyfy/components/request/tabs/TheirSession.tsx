import { BsExplicitFill } from "react-icons/bs";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

import Swal from 'sweetalert2/dist/sweetalert2.js';
import Loading from "@/components/misc/Loading";
import { fancyTimeFormat } from "@/helpers/Utils";
import SpotifyLinkBack from "@/components/misc/SpotifyLinkBack";
import { Users } from "@prisma/client";
import { UserProfile } from "@auth0/nextjs-auth0/client";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import LoadingDots from "@/components/misc/LoadingDots";

import { TbArrowsShuffle, TbRepeat, TbRepeatOff, TbRepeatOnce } from "react-icons/tb";
import { MdComputer, MdSmartphone, MdSpeaker, MdPerson, MdList, MdAlbum, MdPodcasts } from "react-icons/md";

const TheirSession = ({ you, friendSpotifyAuth, friend } : { you: UserProfile, friendSpotifyAuth: SpotifyAuth, friend: Users }) => {

    const [queue, setQueue] = useState(null);
    const [nowPlaying, setNowPlaying] = useState(null);

    // Show end time of progress bar as total rather than remaining
    const [showEndTimeAsTotal, setShowEndTimeAsTotal] = useLocalStorage('showEndTimeAsTotal', false);

    async function showQueueDisclaimer() {
        await Swal.fire({
            html: 
            `
            <p>Please be aware that Partyfy uses Spotify's "Get The User's Queue" API, which currently does not differentiate between your manually curated queue and Spotify's 'Next From' recommendations. This limitation prevents us from distinguishing the tracks you've personally queued from those recommended by Spotify. However, songs queued from Partyfy will always appear first, despite this limitation. We appreciate your understanding as we continue to provide the best possible Partyfy experience within these constraints.</p>
            `
        });
    }

    async function showFullQueue() {
        let accessToken = await friendSpotifyAuth.getAccessToken();
        if (!accessToken) return;
        const response = await fetch('/api/spotify/queue?access_token=' + accessToken);
        if (response.status == 403) { // free accounts
            setQueue([]);
            return;
        }
        const data = await response.json();
        if (data && data.queue) {
            setQueue(data.queue);
        }
    }

    async function showNowPlaying() {
        try {
            let accessToken = await friendSpotifyAuth.getAccessToken();
            if (!accessToken) return;
            const response = await fetch('/api/spotify/nowplaying?access_token=' + accessToken);
            if (response.status == 204) setNowPlaying(false);
            const data = await response.json();
            console.log(data);
            if (data) {
                setNowPlaying(data);
            }
        } catch (e) {}
    }

    useEffect(() => {
        showNowPlaying();
        const interval = setInterval(showNowPlaying, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        showFullQueue();
        const interval = setInterval(showFullQueue, 2000);
        return () => clearInterval(interval);
    }, []);

    if (nowPlaying === false) {
        return (
            <div className="h-full flex flex-col justify-center place-items-center mt-[40%]">
                <h3 className="text-center mt-4 text-2xl">No active session.</h3>
                <h4 className="text-center mt-4 text-gray-400">{`This page will automatically refresh when ${friend.Username} recreates an online session.`}</h4>
            </div>
        ) 
    }

    return (
        <div>
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
                                            nowPlaying.item.album.images.length > 0 &&
                                            <img className="me-4" src={nowPlaying.item.album.images[0].url} style={{ width: '75px', height: '75px' }} />
                                            :
                                            nowPlaying.item
                                            ?
                                            <img className="me-4" src={nowPlaying.item.images[0].url} style={{ width: '75px', height: '75px' }} />
                                            :
                                            <img className="me-4" src={"https://www.freeiconspng.com/uploads/spotify-icon-2.png"} style={{ width: '75px', height: '75px' }} />
                                        }
                                        {
                                            nowPlaying.item && nowPlaying.item.is_local &&
                                            <img className="me-4" src={"https://www.freeiconspng.com/uploads/spotify-icon-2.png"} style={{ width: '75px', height: '75px' }} />
                                        }
                                        {
                                            nowPlaying.item && !nowPlaying.item.is_local &&
                                            <SpotifyLinkBack link={nowPlaying.item.external_urls.spotify} />
                                        }
                                    </div>
                                    <div className="flex justify-between w-full">
                                        <div className="flex flex-col items-start justify-between w-full px-2">
                                            <div className="flex justify-start">
                                                {
                                                    nowPlaying.item 
                                                    ?
                                                    <h6 className="text-left"><strong>{nowPlaying.item.name + (nowPlaying.item.is_local ? ' (Local File)' : '')}</strong></h6>
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
                                                { nowPlaying?.is_playing == false && <h6><i>Paused</i></h6> }
                                                {
                                                    nowPlaying.item
                                                    ?
                                                    <>
                                                    {
                                                        showEndTimeAsTotal
                                                        ?
                                                        <h6 onClick={() => setShowEndTimeAsTotal(false)}>{fancyTimeFormat(nowPlaying.item.duration_ms)}</h6>
                                                        :
                                                        <h6 onClick={() => setShowEndTimeAsTotal(true)}>-{fancyTimeFormat(nowPlaying.item.duration_ms - nowPlaying.progress_ms)}</h6>
                                                    }
                                                    </>
                                                    :
                                                    <h6>?</h6>
                                                }
                                            </div>
                                            <progress className="progress progress-flat-primary w-full" value={nowPlaying.progress_ms} max={nowPlaying.item ? nowPlaying.item.duration_ms : ''}></progress>
                                        </div>
                                        <div className="flex flex-col justify-between my-1 text-white w-[5%] gap-3">
                                            { nowPlaying?.repeat_state == "off" && <TbRepeatOff /> }
                                            { nowPlaying?.repeat_state == "context" && <TbRepeat /> }
                                            { nowPlaying?.repeat_state == "track" && <TbRepeatOnce /> }

                                            { nowPlaying?.shuffle_state == true && <TbArrowsShuffle /> }
                                            { nowPlaying?.shuffle_state == false && <TbArrowsShuffle className="text-gray-400" /> }

                                            { nowPlaying?.device?.type == "Smartphone" && <MdSmartphone /> }
                                            { nowPlaying?.device?.type == "Speaker" && <MdSpeaker /> }
                                            { nowPlaying?.device?.type == "Computer" && <MdComputer /> }

                                            { nowPlaying?.context?.type == "artist" && <MdPerson /> }
                                            { nowPlaying?.context?.type == "playlist" && <MdList /> }
                                            { nowPlaying?.context?.type == "album" && <MdAlbum /> }
                                            { nowPlaying?.context?.type == "show" && <MdPodcasts /> }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                        :
                        <>
                            {
                                nowPlaying === false
                                ?
                                <h3 className="text-center mt-4">Nothing is playing.</h3>
                                :
                                <LoadingDots className="m-16" />
                            }
                        </>
                    }
                </div>
                <h4 className="mt-2 text-2xl">Up Next</h4>
                {
                    queue != null && Array.isArray(queue) && queue.length > 0 &&
                    <h6 className="text-gray-600 mt-2" onClick={() => showQueueDisclaimer()}>Why is the queue inaccurate?</h6>
                }
                <table className="table table-dark mt-3 w-full">
                    <tbody>
                        {
                            queue != null && Array.isArray(queue) &&
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
            {
                queue != null && nowPlaying != null
                ?
                <>
                {
                    queue.length == 0 &&
                    <>
                        <h3 className="text-center mt-4">No queue available. Potential Reasons: </h3>
                        <h4 className="text-center text-gray-400">[because of Spotify API Limitations]</h4>
                        <h3 className="text-center mt-8">{`${friend.Username} is listening to a local file`}</h3>
                        <div className="divider">AND / OR</div>
                        <h3 className="text-center mt-4">{`${friend.Username} has a Spotify free account`}</h3>
                    </>
                }
                </>
                :
                <div className="mt-4">
                    <Loading  />
                </div>
            }
        </div>
    );
}

export default TheirSession;