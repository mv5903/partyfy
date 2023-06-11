import { BsExplicitFill } from "react-icons/bs";
import { use, useEffect, useState } from "react";

import Swal from "sweetalert2";
import Loading from "@/components/misc/Loading";
import { fancyTimeFormat } from "@/helpers/Utils";
import styles from "@/styles/Queue.module.css";
import { FaArrowDown } from "react-icons/fa";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";

const TheirQueue = ({ you, friendSpotifyAuth, friend } : { you: any, friendSpotifyAuth: any, friend: any }) => {

    const [queue, setQueue] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nowPlaying, setNowPlaying] = useState(null);

    async function showQueueDisclaimer() {
        await Swal.fire({
            html: `The queue you see here may contain songs that are not in the queue. This usually happens when the user is listening to a song from a playlist, but it may arise from other circumstances. Because of a limitation with the Spotify API, it is currently impossible to decipher the source of each song in the queue.`
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
        let accessToken = await friendSpotifyAuth.getAccessToken();
        if (!accessToken) return;
        const response = await fetch('/api/spotify/nowplaying?access_token=' + accessToken);
        const data = await response.json();
        if (data && data.item) {
            setNowPlaying(data);
        }
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
                        <div className="mt-2 card bg-dark p-2">
                            { 
                                nowPlaying 
                                ?
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                    <div className="d-flex flex-row align-items-center w-75">
                                        <img className="me-4 rounded" src={nowPlaying.item.album.images[2].url} style={{ width: '75px', height: '75px' }} />
                                        <div>
                                            <div className="w-100" style={{ textAlign: 'left'}}>
                                                <h6><strong>{nowPlaying.item.name}</strong> {nowPlaying.item.explicit === true ? <BsExplicitFill/> : ''}</h6>
                                                <h6><i>{nowPlaying.item.artists[0].name}</i></h6>
                                                <h6 className="text-small" style={{ textAlign: 'left' }}>{fancyTimeFormat(nowPlaying.progress_ms)} / {fancyTimeFormat(nowPlaying.item.duration_ms)}</h6>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                :
                                <Loading />
                            }

                        </div>
                    </div>
                    <h4 className="mt-2">Up Next</h4>
                    <h6 className="text-muted mt-2" onClick={() => showQueueDisclaimer()}>Why am I seeing more songs than the queue?</h6>
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
                                                <div className="d-flex flex-row">
                                                    <img className="me-2 rounded" src={item.album.images[2].url} style={{ width: '50px', height: '50px' }} />    
                                                    <h6 style={{ textAlign: 'left' }}>
                                                        <strong>{item.name}</strong> {item.explicit === true ? <BsExplicitFill/> : ''}<br></br><i>{item.artists[0].name}</i>
                                                    </h6>
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