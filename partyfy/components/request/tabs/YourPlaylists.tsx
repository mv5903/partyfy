import { useContext, useEffect, useState } from "react";
import { FaPlusCircle } from "react-icons/fa";
import { TiArrowBack } from "react-icons/ti";
import { Button } from "@/components/ui/button";

import InfiniteScroll from 'react-infinite-scroll-component';
import { useAlert } from "@/hooks/useAlert";

import { CONSTANTS } from "@/assets/Constants";
import { OAuthRedirect } from "@/helpers/OAuthRedirect";
import Loading from "@/components/misc/Loading";
import SpotifyLinkBack from "@/components/misc/SpotifyLinkBack";
import ScrollingText from "@/components/misc/ScrollingText";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import { getArtistList } from "@/helpers/SpotifyDataParser";
import UserContext from '@/providers/UserContext';
import { UserProfile } from "@auth0/nextjs-auth0/client";
import ListContentCard from "@/components/misc/ListContentCard";
import PlaylistCard from "@/components/misc/PlaylistCard";
import { usePlaylistsStore } from "@/stores/usePlaylistsStore";
import { SkeletonWrapper } from "@/components/ui/skeleton-wrapper";

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
    const alert = useAlert();

    // Use Zustand store for playlists data
    const { playlists: cachedPlaylists, isLoading: playlistsLoading, fetchPlaylists } = usePlaylistsStore();
    const [playlists, setPlaylists] = useState([]);
    const [activePlaylist, setActivePlaylist] = useState<IActivePlaylist>(null);
    const [nextURL, setNextURL] = useState(null);
    const [loadingSongs, setLoadingSongs] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

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
            if (isFirstLoad) setLoadingSongs(true);
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
            setLoadingSongs(false);
        }
        if (isFirstLoad) window.scrollTo(0, 0);
    }

    async function getRecentSongs() {
        setLoadingSongs(true);
        let accessToken = await spotifyAuth.getAccessToken();
        if (!accessToken) return;
        const response = await fetch('/api/spotify/recentlyplayed?user=' + user.getUserID() + '&access_token=' + accessToken);
        if (response.status === 204) {
            setActivePlaylist(null);
            setLoadingSongs(false);
            await alert.fire({
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
            setLoadingSongs(false);
        }
    }

    async function acquireLikedSongsPermission() {
        const result = await alert.fire({
            title: 'Need Liked Songs Permission',
            text: 'To access your liked songs, Spotify requires that you to grant additional permissions. You\'ll be redirected to Spotify to grant this permission, and you\'ll only need to do this once.',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Grant Permission',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            // Store the current origin before redirecting to Spotify
            OAuthRedirect.storeOrigin();
            window.location.href = CONSTANTS.SPOTIFY_AUTH_URL;
        }
    }
    
    useEffect(() => {
        async function fn() {
            setNextURL(null);

            // Fetch playlists (will use cache if available)
            let accessToken = await spotifyAuth.getAccessToken();
            if (accessToken) {
                await fetchPlaylists(accessToken);
            }
        }

        fn();
    }, []);

    // Sync cached playlists to local state with modifications
    useEffect(() => {
        if (cachedPlaylists.length > 0) {
            const playlistsCopy = [...cachedPlaylists];

            if (playlistsCopy.length > 0 && playlistsCopy.some((playlist: any) => playlist.id === 'likedSongs') === false){
                // Add fake liked songs playlist with id 'needLikedSongsPermission' if user has not given permission to access liked songs
                playlistsCopy.unshift({
                    id: 'needLikedSongsPermission',
                    name: 'Liked Songs',
                    images: [],
                    owner: { display_name: 'Requires additional permissions' }
                });
            }
            playlistsCopy.unshift({
                id: 'recentSongs',
                name: 'Recently Queued',
                images: [],
                owner: { display_name: 'from you to others' }
            });

            setPlaylists(playlistsCopy);

            // Show skeleton for minimum 400ms to provide loading feedback
            setTimeout(() => {
                setIsInitialLoad(false);
            }, 400);
        }
    }, [cachedPlaylists]);

    // Stop showing skeleton once loading completes (even if no playlists)
    useEffect(() => {
        if (!playlistsLoading && isInitialLoad) {
            setIsInitialLoad(false);
        }
    }, [playlistsLoading, isInitialLoad]);

    const showPlaylistsSkeleton = isInitialLoad || (playlistsLoading && playlists.length === 0);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            { !activePlaylist && <h3 className="text-2xl text-center my-4 flex-shrink-0">Your Music { playlists && !activePlaylist && `(${playlists.length})`}</h3> }
            <div className="flex-1 flex flex-col justify-center items-center w-full overflow-hidden">
                {
                    !activePlaylist && showPlaylistsSkeleton &&
                    <div className="w-full flex-1 overflow-y-auto overflow-x-hidden px-1 min-h-0">
                        <div className="grid grid-cols-2 gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-stone-900 animate-shimmer rounded-lg h-48" />
                            ))}
                        </div>
                    </div>
                }
                {
                    !activePlaylist && playlists.length > 0 && !showPlaylistsSkeleton &&
                    <div className="w-full flex-1 overflow-y-auto overflow-x-hidden px-1 min-h-0" id="playlists">
                        <InfiniteScroll
                            dataLength={playlists.length}
                            next={() => getMorePlaylists()}
                            hasMore={nextURL}
                            loader={<Loading />}
                            endMessage={<p className="text-center text-gray-400 text-sm mt-4 mb-2">You've reached the end</p>}
                            scrollableTarget="playlists"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                {
                                    playlists.map((playlist: any, key: number) => {
                                        const isNeedLikedSongsPermission = playlist.id === 'needLikedSongsPermission';
                                        let tags = [playlist.public ? 'public' : 'private'];
                                        if (playlist.collaborative) tags.push('collaborative');

                                        return (
                                            <PlaylistCard
                                                key={key}
                                                playlist={playlist}
                                                onClick={
                                                    isNeedLikedSongsPermission
                                                        ? acquireLikedSongsPermission
                                                        : () => getPlaylistSongs(true, playlist.id, tags, playlist.name)
                                                }
                                            />
                                        );
                                    })
                                }
                            </div>
                        </InfiniteScroll>
                    </div>
                }
                {
                    activePlaylist &&
                    <div className="w-full h-full flex flex-col items-center overflow-hidden">
                        <div className="flex justify-center items-center mt-4 flex-shrink-0 gap-4 min-w-0 w-full px-4">
                            <div className="flex-grow min-w-0">
                                <ScrollingText
                                    text={activePlaylist.name}
                                    className="text-center text-2xl font-bold"
                                />
                            </div>
                            <Button onClick={() => setActivePlaylist(null)} className="flex-shrink-0"><TiArrowBack size={30}/></Button>
                        </div>
                        <h6 className="text-sm text-gray-400 my-2 cursor-pointer flex-shrink-0"><i>{activePlaylist.tracks} song{activePlaylist.tracks > 1 && 's'} {activePlaylist.id != 'likedSongs' && '-'} {activePlaylist.id != 'likedSongs' && activePlaylist.tags.join(', ')}</i></h6>
                        {
                            loadingSongs &&
                            <div className="w-full flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-3 px-2 min-h-0">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-stone-900 animate-shimmer rounded-lg h-16" />
                                ))}
                            </div>
                        }
                        {
                            !loadingSongs && activePlaylist.items.length > 0 &&
                            <div className="w-full flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-2" id="playlistItems">
                                 <InfiniteScroll
                                    dataLength={activePlaylist.items.length}
                                    next={() => getPlaylistSongs(false, activePlaylist.id, activePlaylist.tags, activePlaylist.name, parseInt(new URL(activePlaylist.next).searchParams.get('offset')))}
                                    hasMore={activePlaylist.next != null}
                                    loader={<Loading />}
                                    endMessage={<h6 className="text-center mt-2">You've reached the end.</h6>}
                                    scrollableTarget="playlistItems"
                                    className="w-full"
                                >
                                    <div className="flex flex-col gap-2 w-full">
                                    {
                                        activePlaylist.items.map((item: any, key: number) => {
                                            let result = activePlaylist.id == 'recentSongs' ? item : item.track;
                                            if (!result) return;
                                            if (!result.album.images[2]) return;

                                            const listContentCardProps = {
                                                imgSrc: result.album.images[2].url,
                                                spotifyLinkBack: result.external_urls.spotify,
                                                primaryContent: result.name,
                                                position: key + 1,
                                                secondaryContent: getArtistList(result.artists),
                                                explicit: result.explicit,
                                                btnOnClick: () => addToQueue(result),
                                                btnIcon: <FaPlusCircle />,
                                                btnColorClass: 'btn-success w-full',
                                            }

                                            return <ListContentCard key={key} {...listContentCardProps} />;
                                        })
                                    }
                                    </div>
                                </InfiniteScroll>
                            </div>
                        }
                        {
                            !loadingSongs && (activePlaylist.items.length === 0 || activePlaylist.items.every((song: any) => song.is_local === true)) &&
                            <h3 className="text-center m-4">This playlist is either empty or contains all local files which are inaccessible by this application.</h3>
                        }
                    </div>
                }
            </div>
            <alert.AlertComponent />
        </div>
    );
}

export default YourPlaylists;