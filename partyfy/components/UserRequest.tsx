import { TiArrowBack } from "react-icons/ti";
import { FaEye, FaPlus, FaPlusCircle } from "react-icons/fa";
import { BsExplicitFill } from "react-icons/bs";
import { useContext, useState } from "react";

import UserContext from '@/pages/providers/UserContext';
import Swal from "sweetalert2";
import UserQueueOverlay from "./UserQueueOverlay";

const UserRequest = ({ user: activeUser, setUser } : { user: any, setUser: Function }) => {

    const [searchResults, setSearchResults] = useState([]);

    const {
        spotifyAuth,
        user
    } = useContext(UserContext);

    async function searchSpotify(searchQuery: string) {
        let accessToken = await spotifyAuth.getAccessToken();
        const response = await fetch('/api/spotify/search?query=' + searchQuery + '&access_token=' + accessToken);
        const data = await response.json();
        if (!data) return;
        if (!data.tracks) return;
        if (!data.tracks.items) return;
        if (data.tracks.items.length === 0) return;
        setSearchResults(data.tracks.items);
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

    async function showFullQueue() {
        let accessToken = await spotifyAuth.getAccessToken();
        const response = await fetch('/api/spotify/queue?access_token=' + accessToken);
        const data = await response.json();
        console.log(data);
        if (data && data.queue) {
            Swal.fire({
                title: 'Full Queue',
                html: '<div class="text-small"><table class="table"><thead><tr><th scope="col">#</th><th scope="col">Name</th><th scope="col">Artist</th></tr></thead><tbody>' + data.queue.map((item: any, index: number) => {
                    return `<tr><div class="d-flex flex-row justify-content-between"><th scope="row">${index + 1}</th><td><h6 style="text-align: left">${item.name}</h6></td><td><h6 style="text-align: left">${item.artists[0].name}</h6></td></div></tr>`
                }).join('') + '</tbody></table></div>',
                showConfirmButton: true,
                confirmButtonText: 'Close',
                width: '95vw'
            })
        }
    }

    return (
        <div>
            <div className="d-flex flex-row align-items-center card bg-dark p-2">
                <h3 className="text-center me-2">{`You're adding to ${activeUser.Username}'s queue`}</h3>
                <button className="btn btn-primary me-2" onClick={() => showFullQueue()}><FaEye size={25} /></button>
                <button className="btn btn-danger" onClick={() => setUser(null)}><TiArrowBack size={25}/></button>
            </div>
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
        </div>
    )
}

export default UserRequest;