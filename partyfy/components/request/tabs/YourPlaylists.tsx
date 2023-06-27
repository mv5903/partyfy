import { TiArrowBack } from "react-icons/ti";
import { FaArrowDown, FaArrowUp, FaGlobe, FaPlusCircle } from "react-icons/fa";
import { BsExplicitFill, BsGlobe, BsPeopleFill } from "react-icons/bs";
import { useEffect, useState } from "react";

import Loading from "@/components/misc/Loading";
import SpotifyLinkBack from "@/components/misc/SpotifyLinkBack";

const YourPlaylists = ({ you, spotifyAuth, addToQueue } : { you: any, spotifyAuth: any, addToQueue: Function }) => {
    
    const [playlists, setPlaylists] = useState([]);
    const [activePlaylist, setActivePlaylist] = useState(null);
    const [activePlaylistName, setActivePlaylistName] = useState('');
    const [activePlaylistId, setActivePlaylistId] = useState('');
    const [activePlaylistNext, setActivePlaylistNext] = useState(null);
    const [nextURL, setNextURL] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    async function getPlaylists() {
        let accessToken = await spotifyAuth.getAccessToken();
        if (!accessToken) return;
        const response = await fetch('/api/spotify/playlist?action=list&access_token=' + accessToken);
        const data = await response.json();
        setNextURL(data.next);
        if (data && data.items) {
            return data.items;
        }
    }

    async function getMorePlaylists() {
        let accessToken = await spotifyAuth.getAccessToken();
        if (!accessToken) return;
        const response = await fetch('/api/spotify/playlist?action=list&access_token=' + accessToken + '&offset=' + new URL(nextURL).searchParams.get('offset'));
        const data = await response.json();
        setNextURL(data.next);
        if (data && data.items) {
            setPlaylists(playlists.concat(data.items));
        }
    }

    async function getPlaylistSongs(playlist_id: string, name: string, offset: number = 0) {
        setLoadingMore(true);
        if (playlist_id) {
            let accessToken = await spotifyAuth.getAccessToken();
            if (!accessToken) return;
            const response = await fetch('/api/spotify/playlist?action=get&access_token=' + accessToken + '&playlist_id=' + playlist_id + '&offset=' + offset);
            const data = await response.json();
            if (data) {
                setActivePlaylistName(name);
                setActivePlaylistId(playlist_id);
                setActivePlaylistNext(data.next);
                setNextURL(data.next);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setActivePlaylist(activePlaylist && activePlaylist.length > 0 ? activePlaylist.concat(data.items) : data.items);
            }
        }
        setLoadingMore(false);
        setLoading(false);
    }
    
    useEffect(() => {
        async function fn() {
            const playlists = await getPlaylists();
            if (playlists) {
                setLoading(false);
                setPlaylists(playlists);
            }
        }

        fn();
    }, []);

    if (loading) return <Loading />;

    return (
        <>
            <h3 className="text-center mt-4">Your Playlists</h3>
            <div className="d-flex flex-column justify-content-center align-items-center w-100">
                {
                    !activePlaylist && playlists.length > 0 &&
                    <div>
                        <div>
                        {
                            playlists.map((playlist: any, key: number) => {
                                return (
                                    <div key={key} className="card mb-2 p-2 bg-dark w-100">
                                        <div style={{ textAlign: 'left'}} className="d-flex flex-row align-items-center justify-content-between">
                                            {
                                                playlist.images.length > 0
                                                ?
                                                <img src={playlist.images[0].url} width={'50px'} height={'50px'}/>
                                                :
                                                <img src="https://www.freeiconspng.com/uploads/spotify-icon-2.png" style={{ width: '50px', height: '50px' }} />
                                            }
                                            <div className="d-flex flex-column w-75 ps-2">
                                                <div className="d-flex flex-row">
                                                    <h6 className="p-2">{playlist.name}</h6>
                                                    { playlist.collaborative && <h6 className="mt-2"><BsPeopleFill/></h6> }
                                                    { playlist.public && <h6 className="mt-2"><BsGlobe/></h6> }
                                                </div>
                                                <h6 className="p-2"><i>{playlist.owner.display_name}</i></h6>
                                            </div>
                                            <button className="btn btn-dark">
                                                <SpotifyLinkBack link={playlist.external_urls.spotify} />
                                            </button>
                                            <button className="btn btn-success" onClick={() => { setLoading(true); getPlaylistSongs(playlist.id, playlist.name); }}>View</button>
                                        </div>
                                    </div>
                                );
                            })
                        }
                        </div>
                        <div className="d-flex flex-row justify-content-between align-items-center ms-2 me-2">
                            <div className='d-flex flex-row justify-content-center align-items-center'>
                                <FaArrowUp size={30} />
                                <h4 className='ms-2' onClick={() => window.scrollTo(0, 0)}>Back to Top</h4>
                            </div>
                            {
                                nextURL &&
                                <div className='d-flex flex-row justify-content-center align-items-center'>
                                    <h4 className='me-2' onClick={() => getMorePlaylists()}>Show more</h4>
                                    <FaArrowDown size={30} />
                                </div>
                            }
                        </div>
                    </div>
                }
                {
                    activePlaylist &&
                    <div>
                        <div className="">
                            <div className="d-flex justify-content-center align-items-center">
                                <h3 className="text-center mt-2 me-4"><strong>{activePlaylistName}</strong></h3>
                                <button className="btn btn-primary" onClick={() => setActivePlaylist(null)}><TiArrowBack/></button>
                            </div>
                        </div>
                        <div className="d-flex flex-column justify-content-center align-items-center mt-4">
                            {
                                activePlaylist.map((item: any, key: number) => {
                                    if (!item || !item.track) return;
                                    let result = item.track;
                                    if (!result) return;
                                    if (!result.album.images[2]) return;
                                    return (
                                        <div key={key} className="card p-2 me-2 mb-2 ms-2 bg-dark w-100">
                                            <div className="d-flex flex-row align-items-center justify-content-between">
                                                <div className="d-flex flex-row justify-content-start">
                                                    <img src={result.album.images[2].url} className="mt-3" style={{ width: '50px', height: '50px' }} />
                                                    <div style={{ textAlign: 'left', maxWidth: '40vw'}} className="d-flex flex-column ms-2">
                                                        <div className="d-flex flex-row">
                                                            <h6 className="p-2"><strong className="me-2">{key + 1}.</strong>{result.name}</h6>
                                                            {
                                                                result.explicit &&
                                                                <h6 className="mt-2"><BsExplicitFill/></h6>
                                                            }
                                                        </div>
                                                        <h6 className="p-2"><i>{result.artists[0].name}</i></h6>
                                                    </div>
                                                </div>
                                                <div className="d-flex flex-row align-items-center justify-content-end">
                                                    <button className="btn btn-dark">
                                                       <SpotifyLinkBack link={result.external_urls.spotify} />
                                                     </button>
                                                    <button className="btn btn-success" onClick={() => addToQueue(result)}><FaPlusCircle /></button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                        {
                            (activePlaylist.length === 0 || activePlaylist.every((song: any) => song.is_local === true)) &&
                            <h3 className="text-center mt-4 mb-4">This playlist is either empty or contains all local files which are inaccessible by this application.</h3>
                        }
                        {
                            loadingMore
                            ?
                            <Loading />
                            :
                            <div className='d-flex flex-row justify-content-between align-items-center ms-2 me-2'>
                                <div className='d-flex flex-row justify-content-center align-items-center'>
                                    <FaArrowUp size={30} />
                                    <h4 className='ms-2' onClick={() => window.scrollTo(0, 0)}>Back to Top</h4>
                                </div>
                                {
                                    nextURL &&
                                    <div className='d-flex flex-row justify-content-center align-items-center'>
                                        <h4 className='me-2' onClick={() => getPlaylistSongs(activePlaylistId, activePlaylistName, parseInt(new URL(activePlaylistNext).searchParams.get('offset')))}>Show more</h4>
                                        <FaArrowDown size={30} />
                                    </div>
                                }
                            </div>
                        }
                    </div>
                }
            </div>
        </>
    );
}

export default YourPlaylists;