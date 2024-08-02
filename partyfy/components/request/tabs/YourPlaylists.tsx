import { useContext, useEffect, useState } from "react";
import { BsExplicitFill, BsGlobe, BsPeopleFill } from "react-icons/bs";
import { FaExclamationCircle, FaEye, FaHeart, FaHistory, FaPlusCircle, FaSpotify } from "react-icons/fa";
import { TiArrowBack } from "react-icons/ti";

import InfiniteScroll from 'react-infinite-scroll-component';
import Swal from 'sweetalert2/dist/sweetalert2.js';

import { CONSTANTS } from "@/assets/Constants";
import Loading from "@/components/misc/Loading";
import SpotifyLinkBack from "@/components/misc/SpotifyLinkBack";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import { getArtistList } from "@/helpers/SpotifyDataParser";
import UserContext from '@/providers/UserContext';
import { UserProfile } from "@auth0/nextjs-auth0/client";
import ScrollToTopButton from "./utils/ScrollToTopButton";

interface IActivePlaylist {
    name?: string;
    id?: string;
    next?: string;
    items?: any[];
    tracks?: any;
    length?: number;
    tags: string[];
}

const YourPlaylists = ({ you, spotifyAuth, addToQueue } : { you: UserProfile, spotifyAuth: SpotifyAuth, addToQueue: Function }) => {
    
    const [playlists, setPlaylists] = useState([]);
    const [activePlaylist, setActivePlaylist] = useState<IActivePlaylist>(null);
    const [nextURL, setNextURL] = useState(null);
    const [loading, setLoading] = useState(true);

    const { user } = useContext(UserContext);

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

    async function getPlaylistSongs(isFirstLoad: boolean, playlist_id: string, tags: string[], name: string, offset: number = 0) {
        if (playlist_id === 'recentSongs') {
            getRecentSongs();
            return;
        }
        if (playlist_id) {
            let accessToken = await spotifyAuth.getAccessToken();
            if (!accessToken) return;
            const response = await fetch('/api/spotify/playlist?action=get&access_token=' + accessToken + '&playlist_id=' + playlist_id + '&offset=' + offset);
            const data = await response.json();
            let selectedPlaylist = playlists.find((playlist: any) => playlist.id === playlist_id);
            if (data) {
                setActivePlaylist({
                    name,
                    id: playlist_id,
                    next: data.next,
                    items: (activePlaylist && activePlaylist.items && activePlaylist.items.length > 0 ? activePlaylist.items.concat(data.items) : data.items),
                    tracks: playlist_id === "likedSongs" ? selectedPlaylist.count : selectedPlaylist.tracks.total,
                    tags
                });
            }
        }
        setLoading(false);
        if (isFirstLoad) window.scrollTo(0, 0);
    }

    async function getRecentSongs() {
        let accessToken = await spotifyAuth.getAccessToken();
        if (!accessToken) return;
        const response = await fetch('/api/spotify/recentlyplayed?user=' + user.getUserID() + '&access_token=' + accessToken);
        if (response.status === 204) {
            setActivePlaylist(null);
            setLoading(false);
            Swal.fire({
                title: "You haven't queued any songs yet!",
                icon: 'info'
            })
            return;
        }
        const data = await response.json();
        if (data) {
            setActivePlaylist({
                name: 'Recently Queued',
                id: 'recentSongs',
                items: data.tracks,
                tracks: data.tracks.length,
                tags: ['recent', 'up to 50 available']
            });
            setLoading(false);
        } 
    }

    async function acquireLikedSongsPermission() {
        Swal.fire({
            title: 'Need Liked Songs Permission',
            text: 'To access your liked songs, Spotify requires that you to grant additional permissions. You\'ll be redirected to Spotify to grant this permission, and you\'ll only need to do this once.',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Grant Permission',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                window.location.href = CONSTANTS.SPOTIFY_AUTH_URL;
            }
        })
    }
    
    useEffect(() => {
        async function fn() {
            setNextURL(null);
            const playlists = await getPlaylists();
            if (playlists) {
                if (playlists.length > 0 && playlists.some((playlist: any) => playlist.id === 'likedSongs') === false){
                    // Add fake liked songs playlist with id 'needLikedSongsPermission' if user has not given permission to access liked songs
                    playlists.unshift({
                        id: 'needLikedSongsPermission',
                        name: 'Liked Songs',
                        images: [],
                        owner: { display_name: 'Requires additional permissions' }
                    });
                }
                playlists.unshift({
                    id: 'recentSongs',
                    name: 'Recently Queued',
                    images: [],
                    owner: { display_name: 'by you to others' }
                })
                setLoading(false);
                setPlaylists(playlists);
            }
        }

        fn();
    }, []);

    if (loading) return <Loading />;

    return (
        <>
            { !activePlaylist && <h3 className="text-2xl text-center my-4">Your Music { playlists && !activePlaylist && `(${playlists.length})`}</h3> }
            <div className="flex flex-col justify-center items-center w-full">
                {
                    !activePlaylist && playlists.length > 0 &&
                    <div className="w-full">
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
                                        const isLikedSongs = playlist.id === 'likedSongs';
                                        const isRecentSongs = playlist.id === 'recentSongs';
                                        const isNeedLikedSongsPermission = playlist.id === 'needLikedSongsPermission';
                                        let tags = [playlist.public ? 'public' : 'private'];
                                        if (playlist.collaborative) tags.push('collaborative');
                                        return (
                                            <div key={key} className="card mb-2 p-2 bg-zinc-900 opacity-80 w-full">
                                                <div style={{ textAlign: 'left'}} className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        {                                                   
                                                            playlist.images && playlist.images.length > 0
                                                            ?
                                                            <img src={playlist.images[0].url} width={'50px'} height={'50px'}/>
                                                            :
                                                            isLikedSongs
                                                            ?
                                                            <FaHeart size={50} />
                                                            :
                                                            isRecentSongs
                                                            ?
                                                            <FaHistory size={50} />
                                                            :
                                                            <FaSpotify size={50} />
                                                        }
                                                        {
                                                            !isLikedSongs && !isNeedLikedSongsPermission && !isRecentSongs &&
                                                            <SpotifyLinkBack link={playlist.external_urls.spotify} />
                                                        }
                                                    </div>
                                                    <div className="flex flex-col w-3/4 ps-2">
                                                        <div className="flex gap-1">
                                                            <h6 className="p-2">{playlist.name}</h6>
                                                            { playlist.collaborative && <h6 className="mt-3"><BsPeopleFill/></h6> }
                                                            { playlist.public && <h6 className="mt-3"><BsGlobe/></h6> }
                                                            { isNeedLikedSongsPermission && <h6 className="mt-3"><FaExclamationCircle className="text-red-600"/></h6> }
                                                        </div>
                                                        <h6 className="p-2"><i>{playlist.id === 'likedSongs' ? "Your Liked Songs" : playlist.owner.display_name}</i></h6>
                                                    </div>
                                                    {
                                                        isNeedLikedSongsPermission 
                                                        ?
                                                        <button className="btn bg-green-600" onClick={acquireLikedSongsPermission}><FaSpotify className="mr-2" /> Login</button>
                                                        :
                                                        <button className="btn btn-primary" onClick={() => { setLoading(true); getPlaylistSongs(true, playlist.id, tags, playlist.name); }}><FaEye className="mr-2" /> View</button>
                                                    }
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
                        <div className="flex justify-center items-center mt-4">
                            <h3 className="text-center me-4 text-2xl"><strong>{activePlaylist.name}</strong></h3>
                            <button className="btn btn-primary" onClick={() => setActivePlaylist(null)}><TiArrowBack size={30}/></button>
                        </div>
                        <h6 className="text-sm text-gray-400 my-2 cursor-pointer"><i>{activePlaylist.tracks} song{activePlaylist.tracks > 1 && 's'} {activePlaylist.id != 'likedSongs' && '-'} {activePlaylist.id != 'likedSongs' && activePlaylist.tags.join(', ')}</i></h6>
                        {
                            activePlaylist.items.length > 0 &&
                            <div className="w-full">
                                <InfiniteScroll
                                    dataLength={activePlaylist.items.length}
                                    next={() => getPlaylistSongs(false, activePlaylist.id, activePlaylist.tags, activePlaylist.name, parseInt(new URL(activePlaylist.next).searchParams.get('offset')))}
                                    hasMore={activePlaylist.next != null}
                                    loader={<Loading />} 
                                    endMessage={<h6 className="text-center">You've reached the end.</h6>}
                                >
                                    {
                                        activePlaylist.items.map((item: any, key: number) => {
                                            let result = activePlaylist.id == 'recentSongs' ? item : item.track;
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
                                                                    <h6 className="text-left p-2 w-full">
                                                                        <strong className="me-2">{key + 1}.</strong>
                                                                        {result.name}
                                                                        { result.explicit && <BsExplicitFill className="inline-block ml-2 mb-1"/> }
                                                                    </h6>
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