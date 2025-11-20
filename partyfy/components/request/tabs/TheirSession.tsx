import { useEffect, useRef, useState } from "react";
import { BsExplicitFill } from "react-icons/bs";
import { useLocalStorage } from "usehooks-ts";

import Loading from "@/components/misc/Loading";
import SpotifyLinkBack from "@/components/misc/SpotifyLinkBack";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import { fancyTimeFormat } from "@/helpers/Utils";
import { Users } from "@prisma/client";
import { useAlert } from "@/hooks/useAlert";

import { getArtistList } from "@/helpers/SpotifyDataParser";
import { MdAlbum, MdComputer, MdList, MdPerson, MdPodcasts, MdSmartphone, MdSpeaker } from "react-icons/md";
import { TbArrowsShuffle, TbRepeat, TbRepeatOff, TbRepeatOnce } from "react-icons/tb";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TheirSession = ({ friendSpotifyAuth, friend } : { friendSpotifyAuth: SpotifyAuth, friend: Users }) => {

    const alert = useAlert();
    const [queue, setQueue] = useState(null);
    const [nowPlaying, setNowPlaying] = useState(null);

    // Show end time of progress bar as total rather than remaining
    const [showEndTimeAsTotal, setShowEndTimeAsTotal] = useLocalStorage('showEndTimeAsTotal', false);


    // Resize the queue div when the now playing div resizes because of the length of song name and artists
    const [queueHeight, setQueueHeight] = useState("");
    const queueRef = useRef(null);
    const nowPlayingRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            if (queueRef.current) {
                const padding = 10;
                const height = window.innerHeight - queueRef.current.getBoundingClientRect().top - padding;
                // Calculate the height of the queue div, based on the top-left corner to the bottom of the window
                setQueueHeight(height.toFixed(0));
            }
        }

        handleResize();
        // Window resize doesn't need to be checked every second - use window event listener instead
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [queueRef, nowPlayingRef]);


    async function showQueueDisclaimer() {
        await alert.fire({
            title: 'Queue Information',
            text: "Please be aware that Partyfy uses Spotify's \"Get The User's Queue\" API, which currently does not differentiate between your manually curated queue and Spotify's 'Next From' recommendations. This limitation prevents us from distinguishing the tracks you've personally queued from those recommended by Spotify. However, songs queued from Partyfy will always appear first, despite this limitation. We appreciate your understanding as we continue to provide the best possible Partyfy experience within these constraints.",
            icon: 'info'
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
            if (data) {
                setNowPlaying(data);
            }
        } catch (e) {}
    }

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([showFullQueue(), showNowPlaying()]);
        };

        fetchData();
        // Reduced from 1s to 5s - better balance between UX and API load
        const interval = setInterval(fetchData, 1000);

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
                <div className="flex flex-col items-center">
                    { 
                        nowPlaying 
                        ?                            
                        <>
                            <div ref={nowPlayingRef} className="bg-stone-900 p-2 my-2 flex justify-center w-full rounded-md">
                                <div className="flex gap-2 w-full">
                                    <div className="flex flex-col justify-center items-center">
                                        {
                                            nowPlaying.currently_playing_type == 'track'
                                            ?
                                            nowPlaying.item.album.images.length > 0 &&
                                            <img className="w-24" src={nowPlaying.item.album.images[0].url} />
                                            :
                                            nowPlaying.item
                                            ?
                                            <img className="w-24" src={nowPlaying.item.images[0].url} />
                                            :
                                            <img className="w-24" src={"https://www.freeiconspng.com/uploads/spotify-icon-2.png"} />
                                        }
                                        {
                                            nowPlaying.item && nowPlaying.item.is_local &&
                                            <img className="w-24" src={"https://www.freeiconspng.com/uploads/spotify-icon-2.png"} />
                                        }
                                        {
                                            nowPlaying.item && !nowPlaying.item.is_local &&
                                            <SpotifyLinkBack link={nowPlaying.item.external_urls.spotify} />
                                        }
                                    </div>
                                    <div className="flex flex-col w-full">
                                        <div className="flex flex-col items-start justify-between w-full px-2">
                                        <div className="flex justify-start gap-2">
                                            {nowPlaying.item ? (
                                                <h6 className="text-left text-lg">
                                                    <strong>
                                                        {nowPlaying.item.name + (nowPlaying.item.is_local ? ' (Local File)' : '')}
                                                    </strong>
                                                    {nowPlaying.item.explicit === true ? <BsExplicitFill className="inline-block ml-2 mb-1" /> : ''}
                                                </h6>
                                            ) : (
                                                <h6 className="text-left">
                                                    <strong>
                                                        Unknown {nowPlaying.currently_playing_type === 'episode' ? "(Podcasts not supported)" : ""}
                                                    </strong>
                                                </h6>
                                            )}
                                        </div>
                                        <div className="flex justify-start gap-2">
                                            {
                                                nowPlaying.item
                                                ?
                                                <h6 className="text-left"><i>{nowPlaying.currently_playing_type === 'episode' ? nowPlaying.item.show.publisher : getArtistList(nowPlaying.item.artists)}</i></h6>
                                                :
                                                <h6 className="text-left"><i>Unknown artist</i></h6>
                                            }
                                        </div>
                                        <div className="flex justify-start place-items-center gap-2">
                                            {
                                                nowPlaying.currently_playing_type === 'episode'
                                                ?
                                                <h6 className="text-left">{nowPlaying.item ? nowPlaying.item.show.name : ''}</h6>
                                                :
                                                <h6 className="text-left">{nowPlaying.item ? nowPlaying.item.album.name + (nowPlaying.item.disc_number > 1 ? ` (Disc #${nowPlaying.item.disc_number})` : '') : ''}</h6>
                                            }
                                        </div>
                                        <div className="flex justify-between w-full my-1">
                                            <h6>{fancyTimeFormat(nowPlaying.progress_ms)}</h6>
                                            <div className="flex justify-around items-center text-white gap-4">
                                                { nowPlaying?.repeat_state == "off" &&
                                                    <Popover>
                                                        <PopoverTrigger><TbRepeatOff /></PopoverTrigger>
                                                        <PopoverContent className="bg-stone-800 border-0 text-white w-auto whitespace-nowrap">Repeat is off</PopoverContent>
                                                    </Popover>
                                                }
                                                { nowPlaying?.repeat_state == "context" &&
                                                    <Popover>
                                                        <PopoverTrigger><TbRepeat /></PopoverTrigger>
                                                        <PopoverContent className="bg-stone-800 border-0 text-white w-auto whitespace-nowrap">Repeat context</PopoverContent>
                                                    </Popover>
                                                }
                                                { nowPlaying?.repeat_state == "track" &&
                                                    <Popover>
                                                        <PopoverTrigger><TbRepeatOnce /></PopoverTrigger>
                                                        <PopoverContent className="bg-stone-800 border-0 text-white w-auto whitespace-nowrap">Repeat track</PopoverContent>
                                                    </Popover>
                                                }

                                                { nowPlaying?.shuffle_state == true &&
                                                    <Popover>
                                                        <PopoverTrigger><TbArrowsShuffle /></PopoverTrigger>
                                                        <PopoverContent className="bg-stone-800 border-0 text-white w-auto whitespace-nowrap">Shuffle is on</PopoverContent>
                                                    </Popover>
                                                }
                                                { nowPlaying?.shuffle_state == false &&
                                                    <Popover>
                                                        <PopoverTrigger><TbArrowsShuffle className="text-gray-400" /></PopoverTrigger>
                                                        <PopoverContent className="bg-stone-800 border-0 text-white w-auto whitespace-nowrap">Shuffle is off</PopoverContent>
                                                    </Popover>
                                                }

                                                { nowPlaying?.device?.type == "Smartphone" &&
                                                    <Popover>
                                                        <PopoverTrigger><MdSmartphone /></PopoverTrigger>
                                                        <PopoverContent className="bg-stone-800 border-0 text-white w-auto whitespace-nowrap">Playing on smartphone</PopoverContent>
                                                    </Popover>
                                                }
                                                { nowPlaying?.device?.type == "Speaker" &&
                                                    <Popover>
                                                        <PopoverTrigger><MdSpeaker /></PopoverTrigger>
                                                        <PopoverContent className="bg-stone-800 border-0 text-white w-auto whitespace-nowrap">Playing on speaker</PopoverContent>
                                                    </Popover>
                                                }
                                                { nowPlaying?.device?.type == "Computer" &&
                                                    <Popover>
                                                        <PopoverTrigger><MdComputer /></PopoverTrigger>
                                                        <PopoverContent className="bg-stone-800 border-0 text-white w-auto whitespace-nowrap">Playing on computer</PopoverContent>
                                                    </Popover>
                                                }

                                                { nowPlaying?.context?.type == "artist" &&
                                                    <Popover>
                                                        <PopoverTrigger><MdPerson /></PopoverTrigger>
                                                        <PopoverContent className="bg-stone-800 border-0 text-white w-auto whitespace-nowrap">Playing from artist</PopoverContent>
                                                    </Popover>
                                                }
                                                { nowPlaying?.context?.type == "playlist" &&
                                                    <Popover>
                                                        <PopoverTrigger><MdList /></PopoverTrigger>
                                                        <PopoverContent className="bg-stone-800 border-0 text-white w-auto whitespace-nowrap">Playing from playlist</PopoverContent>
                                                    </Popover>
                                                }
                                                { nowPlaying?.context?.type == "album" &&
                                                    <Popover>
                                                        <PopoverTrigger><MdAlbum /></PopoverTrigger>
                                                        <PopoverContent className="bg-stone-800 border-0 text-white w-auto whitespace-nowrap">Playing from album</PopoverContent>
                                                    </Popover>
                                                }
                                                { nowPlaying?.context?.type == "show" &&
                                                    <Popover>
                                                        <PopoverTrigger><MdPodcasts /></PopoverTrigger>
                                                        <PopoverContent className="bg-stone-800 border-0 text-white w-auto whitespace-nowrap">Playing from podcast</PopoverContent>
                                                    </Popover>
                                                }
                                            </div>
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
                                            <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-white h-full rounded-full transition-all duration-300"
                                                    style={{ width: `${nowPlaying.item ? (nowPlaying.progress_ms / nowPlaying.item.duration_ms) * 100 : 0}%` }}
                                                ></div>
                                            </div>
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
                                <div className="bg-stone-900 p-2 my-2 w-full h-[15vh] flex justify-center place-items-center rounded-md">
                                    <Card className="bg-stone-800 border-stone-700">
                                        <Spinner variant="wave" className="text-stone-400" />
                                    </Card>
                                </div>
                            }
                        </>
                    }
                </div>
                <h4 className="my-2 text-2xl">Next</h4>
                <div className="overflow-auto" style={{ maxHeight: `${queueHeight}px` }} ref={queueRef} >
                        {
                            queue != null && Array.isArray(queue) &&
                            queue.map((item: any, index: number) => {
                                return (
                                    <div key={index}>
                                        <div className="flex justify-between w-full px-0 gap-1">
                                            <h2 className="mr-2">{index + 1}</h2>
                                            <img 
                                                className="me-2" 
                                                src={item.type == 'track' ? item.album.images[2].url : item.images[0].url} 
                                                style={{ width: '50px', height: '50px' }} 
                                            />
                                            <div className="w-2/3">
                                                <div className="flex justify-start">
                                                    <h6 className="text-left text-md">
                                                        <strong>
                                                            {item.name}
                                                        </strong>
                                                        {item.explicit === true ? <BsExplicitFill className="inline-block ml-2 mb-1" /> : ''}
                                                    </h6>
                                                </div>
                                                <h6 className="text-left">
                                                    <i>{item.type == 'track' ? getArtistList(item.artists) : item.show.name}</i>
                                                </h6>
                                            </div>
                                            <SpotifyLinkBack link={item.external_urls.spotify} />
                                        </div>
                                        {
                                            index < queue.length - 1 &&
                                            <Separator className="my-2 bg-stone-600" />
                                        }
                                    </div>
                                );
                            })
                        }
                </div>
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
                        <Separator className="my-4" />
                        <p className="text-center">AND / OR</p>
                        <h3 className="text-center mt-4">{`${friend.Username} has a Spotify free account`}</h3>
                    </>
                }
                </>
                :
                <div className="mt-4">
                    <Loading  />
                </div>
            }
            <alert.AlertComponent />
        </div>
    );
}

export default TheirSession;