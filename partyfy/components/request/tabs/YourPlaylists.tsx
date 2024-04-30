import { TiArrowBack } from "react-icons/ti";
import { FaPlusCircle } from "react-icons/fa";
import { BsExplicitFill, BsGlobe, BsPeopleFill } from "react-icons/bs";
import { useEffect, useState } from "react";

import InfiniteScroll from 'react-infinite-scroll-component';

import Loading from "@/components/misc/Loading";
import SpotifyLinkBack from "@/components/misc/SpotifyLinkBack";
import ScrollToTopButton from "./utils/ScrollToTopButton";
import { UserProfile } from "@auth0/nextjs-auth0/client";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import { getArtistList } from "@/helpers/SpotifyDataParser";

interface IActivePlaylist {
    name?: string;
    id?: string;
    next?: string;
    items?: any[];
}

const YourPlaylists = ({ you, spotifyAuth, addToQueue } : { you: UserProfile, spotifyAuth: SpotifyAuth, addToQueue: Function }) => {
    
    const [playlists, setPlaylists] = useState([]);
    const [activePlaylist, setActivePlaylist] = useState<IActivePlaylist>(null);
    const [nextURL, setNextURL] = useState(null);
    const [loading, setLoading] = useState(true);

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

    async function getPlaylistSongs(isFirstLoad: boolean, playlist_id: string, name: string, offset: number = 0) {
        if (playlist_id) {
            let accessToken = await spotifyAuth.getAccessToken();
            if (!accessToken) return;
            const response = await fetch('/api/spotify/playlist?action=get&access_token=' + accessToken + '&playlist_id=' + playlist_id + '&offset=' + offset);
            const data = await response.json();
            if (data) {
                setActivePlaylist({
                    name,
                    id: playlist_id,
                    next: data.next,
                    items: (activePlaylist && activePlaylist.items && activePlaylist.items.length > 0 ? activePlaylist.items.concat(data.items) : data.items)
                });
            }
        }
        setLoading(false);
        if (isFirstLoad) window.scrollTo(0, 0);
    }
    
    useEffect(() => {
        async function fn() {
            setNextURL(null);
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
            <h3 className="text-2xl text-center my-4">Your Playlists</h3>
            <div className="flex flex-col justify-center items-center w-full">
                {
                    !activePlaylist && playlists.length > 0 &&
                    <div>
                        <div>
                            <InfiniteScroll
                                dataLength={playlists.length}
                                next={() => getMorePlaylists()}
                                hasMore={nextURL}
                                loader={<Loading />}
                                endMessage={<h6 className="text-center">You've reached the end.</h6>}
                            >
                                {
                                    playlists.map((playlist: any, key: number) => {
                                        return (
                                            <div key={key} className="card mb-2 p-2 bg-zinc-900 opacity-80 w-full">
                                                <div style={{ textAlign: 'left'}} className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        {
                                                            playlist.images && playlist.images.length > 0
                                                            ?
                                                            <img src={playlist.images[0].url} width={'50px'} height={'50px'}/>
                                                            :
                                                            <img src="https://www.freeiconspng.com/uploads/spotify-icon-2.png" style={{ width: '50px', height: '50px' }} />
                                                        }
                                                        <SpotifyLinkBack link={playlist.external_urls.spotify} />
                                                    </div>
                                                    <div className="flex flex-col w-3/4 ps-2">
                                                        <div className="flex">
                                                            <h6 className="p-2">{playlist.name}</h6>
                                                            { playlist.collaborative && <h6 className="mt-3"><BsPeopleFill/></h6> }
                                                            { playlist.public && <h6 className="mt-3"><BsGlobe/></h6> }
                                                        </div>
                                                        <h6 className="p-2"><i>{playlist.owner.display_name}</i></h6>
                                                    </div>
                                                    <button className="btn btn-primary" onClick={() => { setLoading(true); getPlaylistSongs(true, playlist.id, playlist.name); }}>View</button>
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </InfiniteScroll>
                        </div>
                        <ScrollToTopButton />
                    </div>
                }
                {
                    activePlaylist &&
                    <div className="w-full flex flex-col items-center">
                        <div className="flex justify-center items-center">
                            <h3 className="text-center me-4 text-2xl"><strong>{activePlaylist.name}</strong></h3>
                            <button className="btn btn-primary" onClick={() => setActivePlaylist(null)}><TiArrowBack/></button>
                        </div>
                        {
                            activePlaylist.items.length > 0 &&
                            <div className="">
                                <InfiniteScroll
                                    dataLength={activePlaylist.items.length}
                                    next={() => getPlaylistSongs(false, activePlaylist.id, activePlaylist.name, parseInt(new URL(activePlaylist.next).searchParams.get('offset')))}
                                    hasMore={activePlaylist.next != null}
                                    loader={<Loading />} 
                                    endMessage={<h6 className="text-center">You've reached the end.</h6>}
                                >
                                    {
                                        activePlaylist.items.map((item: any, key: number) => {
                                            if (!item || !item.track) return;
                                            let result = item.track;
                                            if (!result) return;
                                            if (!result.album.images[2]) return;
                                            return (
                                                <div key={key} className="card p-2 my-2 bg-zinc-900 w-full">
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex justify-start w-full">
                                                            <div className="flex flex-col">
                                                                <img src={result.album.images[2].url} className="mt-3" style={{ width: '50px', height: '50px' }} />
                                                                <SpotifyLinkBack link={result.external_urls.spotify} />
                                                            </div>
                                                            <div className="text-left w-3/4">
                                                                <div className="flex justify-start">
                                                                    <h6 className="p-2 w-10/12"><strong className="me-2">{key + 1}.</strong>{result.name}</h6>
                                                                    { result.explicit && <BsExplicitFill className="mt-3"/> }
                                                                </div>
                                                                <h6 className="p-2"><i>{getArtistList(result.artists)}</i></h6>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-end">
                                                            <button className="btn btn-success" onClick={() => addToQueue(result)}><FaPlusCircle /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </InfiniteScroll>
                            </div>
                        }
                        {
                            (activePlaylist.items.length === 0 || activePlaylist.items.every((song: any) => song.is_local === true)) &&
                            <h3 className="text-center m-4">This playlist is either empty or contains all local files which are inaccessible by this application.</h3>
                        }
                        <ScrollToTopButton />
                    </div>
                }
            </div>
        </>
    );
}

export default YourPlaylists;