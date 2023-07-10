import { TiArrowBack } from "react-icons/ti";
import {  useContext, useEffect, useState } from "react";
import { RadioGroup, Radio } from "react-radio-group";

import UserContext from '@/providers/UserContext';
import Swal from "sweetalert2";
import Loading from "../misc/Loading";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";

import Search from "./tabs/Search";
import TheirQueue from "./tabs/TheirQueue";
import YourPlaylists from "./tabs/YourPlaylists";

const UserRequest = ({ currentFriend, setCurrentFriend } : { currentFriend: any, setCurrentFriend: Function }) => {

    enum RequestPageView {
        Search,
        TheirSession,
        YourPlaylists
    }

    const {
        spotifyAuth,
        user
    } = useContext(UserContext);

    const [friendSpotifyAuth, setFriendSpotifyAuth] = useState<SpotifyAuth>(null);
    const [requestPageView, setRequestPageView] = useState(RequestPageView.Search);

    async function loadFriendSpotifyAuth() {
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
            case RequestPageView.TheirSession:
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
            // Show loading dialog while we add the song to the queue
            Swal.fire({
                title: 'Sending to queue...',
                timerProgressBar: true,
                didOpen: () => {
                    Swal.showLoading()
                }
            });
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
                    timer: 800,
                    showConfirmButton: false
                })
            }
        }
    }

    function getPageViewHelper() {
        switch (requestPageView) {
            case RequestPageView.Search:
                return "Search";
            case RequestPageView.TheirSession:
                return "Their Queue";
            case RequestPageView.YourPlaylists:
                return "Your Playlists";
        }
    }

    function setPageViewHelper(e: RequestPageView) {
        document.querySelector('.active')?.classList.remove('active');
        setRequestPageView(e);
    }

    return (
        <div>
            {
                !friendSpotifyAuth ? <Loading /> :
                <>
                    <div className="d-flex flex-row align-items-center justify-content-between p-2">
                        <h3 className="text-center me-2 pt-2">Controlling: <span><strong>{currentFriend.Username}</strong></span></h3>
                        <button className="btn btn-danger" onClick={() => setCurrentFriend(null)}><TiArrowBack size={25}/></button>
                    </div>
                    <div>
                        <RadioGroup data-toggle="buttons" className="mt-3 d-flex flex-row justify-content-between btn-group btn-group-toggle" style={{ width: '98vw' }} name="fruit" selectedValue={getPageViewHelper()} onChange={e => setPageViewHelper(e)}>
                            <label className="btn btn-dark active">
                                <Radio value={RequestPageView.Search} className="d-none" />Search
                            </label>
                            <label className="btn btn-dark">
                                <Radio value={RequestPageView.YourPlaylists} className="d-none" />Your Playlists
                            </label>
                            <label className="btn btn-dark">
                                <Radio value={RequestPageView.TheirSession} className="d-none" />Their Session
                            </label>
                        </RadioGroup>
                        { currentView() }
                    </div>
                </>
            }
        </div>
    )
}

export default UserRequest;