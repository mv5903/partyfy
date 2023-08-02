import { BsExplicitFill } from "react-icons/bs";
import { useEffect, useState } from "react";

import Swal from "sweetalert2";
import Loading from "@/components/misc/Loading";
import { fancyTimeFormat } from "@/helpers/Utils";
import SpotifyLinkBack from "@/components/misc/SpotifyLinkBack";

const TheirQueue = ({ you, friendSpotifyAuth, friend } : { you: any, friendSpotifyAuth: any, friend: any }) => {

    const [queue, setQueue] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nowPlaying, setNowPlaying] = useState(null);

    async function showQueueDisclaimer() {
        await Swal.fire({
            html: 
            `
            <small>Please be aware that Partyfy uses Spotify's "Get The User's Queue" API, which currently does not differentiate between your manually curated queue and Spotify's 'Next From' recommendations. This limitation prevents us from distinguishing the tracks you've personally queued from those recommended by Spotify. However, your friend's queue will always appear first, despite this limitation. We appreciate your understanding as we continue to provide the best possible Partyfy experience within these constraints.</small>
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
            if (data && data.item) {
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
        <div className="text-small">
            {
                queue.length > 0 
                ?
                <div>
                    <h5 className="mt-4">Their Session</h5>
                    <div className="mt-2">
                        <div className="d-flex flex-row justify-content-center align-items-center">
                           <h6>Now Playing</h6>
                        </div>
                        <div className="mt-2 card bg-dark p-2 d-flex flex-row justify-content-center">
                            { 
                                nowPlaying 
                                ?
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                    <div className="d-flex flex-row align-items-center w-100">
                                        <img className="me-4" src={nowPlaying.item.album.images[2].url} style={{ width: '75px', height: '75px' }} />
                                        <div className="d-flex flex-row justify-content-center">
                                            <div style={{ textAlign: 'left'}}>
                                                <h6><strong>{nowPlaying.item.name}</strong> {nowPlaying.item.explicit === true ? <BsExplicitFill/> : ''}</h6>
                                                <h6><i>{nowPlaying.item.artists[0].name}</i></h6>
                                                <h6 className="text-small" style={{ textAlign: 'left' }}>{fancyTimeFormat(nowPlaying.progress_ms)} / {fancyTimeFormat(nowPlaying.item.duration_ms)}</h6>
                                            </div>
                                            <SpotifyLinkBack link={nowPlaying.item.external_urls.spotify} />
                                        </div>
                                    </div>
                                </div>
                                :
                                <Loading />
                            }

                        </div>
                    </div>
                    <h4 className="mt-2">Up Next</h4>
                    <h6 className="text-muted mt-2" onClick={() => showQueueDisclaimer()}>Why is the queue inaccurate?</h6>
                    <table className="table table-dark mt-3" style={{ fontSize: '.5em'}}>
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Song</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                queue.map((item: any, index: number) => {
                                    return (
                                        <tr key={index}>
                                            <th scope="row">{index + 1}</th>
                                            <td>
                                                <div className="d-flex flex-row align-items-center justify-content-between">
                                                    <img className="me-2" src={item.album.images[2].url} style={{ width: '50px', height: '50px' }} />    
                                                    <h6 style={{ textAlign: 'left', minWidth: '50vw' }}>
                                                        <strong>{item.name}</strong> {item.explicit === true ? <BsExplicitFill/> : ''}<br></br><i>{item.artists[0].name}</i>
                                                    </h6>
                                                    <SpotifyLinkBack link={item.external_urls.spotify} />
                                                </div>
                                            </td>
                                        </tr>
                                    )
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
                            <h3 className="text-center mt-4">No active session.</h3>
                        </>
                    }
                </>
            }
        </div>
    );
}

export default TheirQueue;