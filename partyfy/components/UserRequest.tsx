import { TiArrowBack } from "react-icons/ti";
import { FaEye, FaPlus, FaPlusCircle } from "react-icons/fa";
import { BsExplicitFill } from "react-icons/bs";
import { use, useContext, useEffect, useState } from "react";
import { RadioGroup, Radio } from "react-radio-group";

import UserContext from '@/providers/UserContext';
import Swal from "sweetalert2";
import UserQueueOverlay from "./UserQueueOverlay";
import Loading from "./Loading";

const UserRequest = ({ user: activeUser, setUser } : { user: any, setUser: Function }) => {

    enum RequestPageView {
        Search,
        TheirQueue,
        YourPlaylists
    }

    const {
        spotifyAuth,
        user
    } = useContext(UserContext);

    const [requestPageView, setRequestPageView] = useState(RequestPageView.Search);

    const currentView = () => {
        switch (requestPageView) {
            case RequestPageView.Search:
                return <Search you={user} spotifyAuth={spotifyAuth} addToQueue={addToQueue} />;
            case RequestPageView.TheirQueue:
                return <TheirQueue you={user} spotifyAuth={spotifyAuth} friend={activeUser} />;
            case RequestPageView.YourPlaylists:
                return <YourPlaylists you={user} spotifyAuth={spotifyAuth} addToQueue={addToQueue} />;
        }
    }

    async function addToQueue(song: any) {
        let result = await Swal.fire({
            title: 'Queue Confirmation',
            html: `You're about to add <strong>${song.name}${song.explicit ? ' (Explicit Version)' : ''}</strong> by <i>${song.artists[0].name}</i> to ${activeUser.Username}'s queue.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Add it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            const uri = song.uri;
            const UserID = activeUser.UserID;
            const response = await fetch('/api/spotify/queue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uri: uri,
                    UserID: UserID,
                    refresh_token: encodeURIComponent(activeUser.RefreshToken)
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
            <div className="d-flex flex-row align-items-center justify-content-between card bg-dark p-2">
                <h3 className="text-center me-2 pt-2">{`Controlling: ${activeUser.Username}`}</h3>
                <button className="btn btn-danger" onClick={() => setUser(null)}><TiArrowBack size={25}/></button>
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

const TheirQueue = ({ you, spotifyAuth, friend } : { you: any, spotifyAuth: any, friend: any }) => {

    const [queue, setQueue] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    async function showQueueDisclaimer() {
        await Swal.fire({
            html: `The queue you see here may contain songs that are not in the queue. This usually happens when the user is listening to a song from a playlist, but it may arise from other circumstances. Because of a limitation with the Spotify API, it is currently impossible to decipher the source of each song in the queue.`
        });
    }

    async function showFullQueue() {
        let accessToken = await spotifyAuth.getAccessToken();
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
    return (
        <>
            <h3 className="mt-4">{'This feature is currently in development. Come back later!'}</h3>
        </>
    );
}

export default UserRequest;