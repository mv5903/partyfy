import { TiArrowBack } from "react-icons/ti";
import { FaArrowDown, FaArrowUp, FaEye, FaPlus, FaPlusCircle } from "react-icons/fa";
import { BsExplicitFill } from "react-icons/bs";
import {  useContext, useEffect, useState } from "react";
import { RadioGroup, Radio } from "react-radio-group";

import UserContext from '@/providers/UserContext';
import Swal from "sweetalert2";
import Loading from "../misc/Loading";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";

const UserRequest = ({ currentFriend, setCurrentFriend } : { currentFriend: any, setCurrentFriend: Function }) => {

    enum RequestPageView {
        Search,
        TheirQueue,
        YourPlaylists
    }

    const {
        spotifyAuth,
        user
    } = useContext(UserContext);

    const [friendSpotifyAuth, setFriendSpotifyAuth] = useState<SpotifyAuth>(null);
    const [requestPageView, setRequestPageView] = useState(RequestPageView.Search);

    async function loadFriendSpotifyAuth() {
        console.log(JSON.stringify(currentFriend));
        if (currentFriend && currentFriend.RefreshToken) {
            let friendSpotifyAuth = new SpotifyAuth(currentFriend.RefreshToken);
            setFriendSpotifyAuth(friendSpotifyAuth);
        } else {
            Swal.fire({
                title: 'No Spotify account linked',
                html: `Your friend <strong>${currentFriend.Username}</strong> needs to link their Spotify account to account before you can request songs.`,
                icon: 'error',
            });
            setCurrentFriend(null);
        }
    }

    useEffect(() => {
        loadFriendSpotifyAuth();
    }, []);

    const currentView = () => {
        switch (requestPageView) {
            case RequestPageView.Search:
                return <Search you={user} spotifyAuth={spotifyAuth} addToQueue={addToQueue} />;
            case RequestPageView.TheirQueue:
                return <TheirQueue you={user} friendSpotifyAuth={friendSpotifyAuth} friend={currentFriend} />;
            case RequestPageView.YourPlaylists:
                return <YourPlaylists you={user} spotifyAuth={spotifyAuth} addToQueue={addToQueue} />;
        }
    }

    async function addToQueue(song: any) {
        let result = await Swal.fire({
            title: 'Queue Confirmation',
            html: `You're about to add <strong>${song.name}${song.explicit ? ' (Explicit Version)' : ''}</strong> by <i>${song.artists[0].name}</i> to ${currentFriend.Username}'s queue.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Add it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            const uri = song.uri;
            let friendAccessToken = await friendSpotifyAuth.getAccessToken();
            const response = await fetch('/api/spotify/queue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uri: uri,
                    UserID: currentFriend.UserID,
                    access_token: friendAccessToken
                })
            });
            const data = await response.json();
            if (data && data.name && data.name === 'OK') {
                Swal.fire({
                    title: song.name + ' added to queue!',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                })
            }
        }
    }

    function getPageViewHelper() {
        switch (requestPageView) {
            case RequestPageView.Search:
                return "Search";
            case RequestPageView.TheirQueue:
                return "Their Queue";
            case RequestPageView.YourPlaylists:
                return "Your Playlists";
        }
    }

    function setPageViewHelper(e: string) {
        document.querySelector('.active')?.classList.remove('active');
        switch (e) {
            case "Search":
                setRequestPageView(RequestPageView.Search);
                break;
            case "Their Queue":
                setRequestPageView(RequestPageView.TheirQueue);
                break;
            case "Your Playlists":
                setRequestPageView(RequestPageView.YourPlaylists);
                break;
        }
    }

    return (
        <div>
            {
                !friendSpotifyAuth ? <Loading /> :
                <>
                    <div className="d-flex flex-row align-items-center justify-content-between card bg-dark p-2">
                        <h3 className="text-center me-2 pt-2">{`Controlling: ${currentFriend.Username}`}</h3>
                        <button className="btn btn-danger" onClick={() => setCurrentFriend(null)}><TiArrowBack size={25}/></button>
                    </div>
                    <div>
                        <RadioGroup data-toggle="buttons" className="mt-3 d-flex flex-row justify-content-between btn-group btn-group-toggle" name="fruit" selectedValue={getPageViewHelper()} onChange={e => setPageViewHelper(e)}>
                            <label className="btn btn-dark active">
                                <Radio value="Search" style={{ visibility: "hidden"}} />Search
                            </label>
                            <label className="btn btn-dark">
                                <Radio value="Your Playlists" style={{ visibility: "hidden"}} />Your Playlists
                            </label>
                            <label className="btn btn-dark">
                                <Radio value="Their Queue" style={{ visibility: "hidden"}} />Their Queue
                            </label>
                        </RadioGroup>
                        { currentView() }
                    </div>
                </>
            }
        </div>
    )
}

const Search = ({ you, spotifyAuth, addToQueue } : { you: any, spotifyAuth: any, addToQueue: Function }) => {

    const [searchResults, setSearchResults] = useState([]);

    async function searchSpotify(searchQuery: string) {
        if (searchQuery.length === 0) {
            setSearchResults([]);
            return;
        } 
        let accessToken = await spotifyAuth.getAccessToken();
        const response = await fetch('/api/spotify/search?query=' + searchQuery + '&access_token=' + accessToken);
        if (!response.ok) {
            Swal.fire({
                title: 'Error',
                text: 'An error occurred while searching for songs, response: ' + response.statusText + '. Please try again later. Spotify Authentication Information: ' + spotifyAuth.toString(),
                icon: 'error',
            })
        }
        const data = await response.json();
        if (!data) return;
        if (!data.tracks ) {
            Swal.fire({
                title: 'Error',
                text: 'An error occurred while searching for songs, response: ' + JSON.stringify(data) + '. Please try again later. Spotify Authentication Information: ' + spotifyAuth.toString(),
                icon: 'error',
            })
        }
        if (!data.tracks.items) return;
        if (data.tracks.items.length === 0) return;
        setSearchResults(data.tracks.items);
    }


    return (
        <>
            <div>
                <h4 className="text-center mt-4">Add Song</h4>
                <div className="d-flex flex-row justify-content-center">
                    <input className="form-control w-75" placeholder="Search for a song..." onChange={(e : any) => searchSpotify(e.target.value)}/>
                </div>
            </div>
            {
                searchResults.length > 0 &&
                <div className="d-flex flex-column justify-content-center align-items-center mt-4">
                    {
                        searchResults.map((result: any, key: number) => {
                            return (
                                <div key={key} className="card p-2 m-2 bg-dark w-100">
                                    <div className="d-flex flex-row align-items-center justify-content-between">
                                        <img src={result.album.images[2].url} />
                                        <div className="d-flex flex-column justify-content-start">
                                            <div className="d-flex">
                                                <h6 className="p-2">{result.name}</h6>
                                                {
                                                    result.explicit &&
                                                    <h6 className="mt-2"><BsExplicitFill/></h6>
                                                }
                                            </div>
                                            <h6 className="p-2"><i>{result.artists[0].name}</i></h6>
                                        </div>
                                        <button className="btn btn-success" onClick={() => addToQueue(result)}><FaPlusCircle /></button>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            }
        </>
    );
}

const TheirQueue = ({ you, friendSpotifyAuth, friend } : { you: any, friendSpotifyAuth: any, friend: any }) => {

    const [queue, setQueue] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
                    <h3 className="mt-4">Queue</h3>
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
                            <h3 className="text-center mt-4">No songs in queue.</h3>
                        </>
                    }
                </>
            }
        </div>
    );
}

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
                                                <div className="d-flex">
                                                    <h6 className="p-2">{playlist.name}</h6>
                                                </div>
                                                <h6 className="p-2"><i>{playlist.owner.display_name}</i></h6>
                                            </div>
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
                                                    <div style={{ textAlign: 'left'}} className="d-flex flex-column ms-2">
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
                                                <button className="btn btn-success" onClick={() => addToQueue(result)}><FaPlusCircle /></button>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
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

export default UserRequest;