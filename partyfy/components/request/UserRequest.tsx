import { TiArrowBack } from "react-icons/ti";
import {  useContext, useEffect, useState } from "react";
import { RadioGroup, Radio } from "react-radio-group";

import UserContext from '@/providers/UserContext';
import Swal from 'sweetalert2';
import Loading from "../misc/Loading";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import { getUserID } from '@/helpers/Utils';

import Search from "./tabs/Search";
import TheirQueue from "./tabs/TheirQueue";
import YourPlaylists from "./tabs/YourPlaylists";
import { Users } from "@prisma/client";
import { Supabase } from "@/helpers/SupabaseHelper";

const UserRequest = ({ currentFriend, setCurrentFriend } : { currentFriend: Users, setCurrentFriend: Function }) => {

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
            // User attempts to queue when friend does not have an active Spotify session
            if (data && data.name && data.name === 'Not Found') {
                Swal.fire({
                    title: 'Error',
                    html: `We couldn't add this song to the queue because your friend does not currently have an active Spotify session.`,
                    icon: 'error'
                })   
            }
            // User can susccessfully queue
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

    useEffect(() => {
        async function unattendedQueuesAllowed() {
            const response = await fetch('/api/database/unattendedqueues?UserID=' + currentFriend.UserID);
            const data = await response.json();
    
            if (data) {
                if (!data.UnattendedQueues)  {
                    Swal.fire({
                        title: 'Notice',
                        html: `Your friend <strong>${currentFriend.Username}</strong> has disabled unattended queues. You will no longer be able to request songs until it has been turned back on.`,
                        icon: 'warning'
                    })
                    setCurrentFriend(null);
                }
            }
        }
    
        async function isStillFriends() {
            if (!currentFriend) return;
            const response = await fetch(`/api/database/friends?action=isFriend&UserID=${getUserID(user)}&FriendUserID=${currentFriend.UserID}`);
            const data = await response.json();
            
            if (!data) {
                Swal.fire({
                    title: 'Notice',
                    html: `Your friend <strong>${currentFriend.Username}</strong> has removed you from their friends list. You will no longer be able to request songs until they add you back.`,
                    icon: 'warning'
                })
                setCurrentFriend(null);
            }
        }

        loadFriendSpotifyAuth();
        unattendedQueuesAllowed();
        isStillFriends();

        Supabase
            .channel('any')
            .on('postgres_changes', { event: '*', schema: '*' }, payload => {
                unattendedQueuesAllowed();
                isStillFriends();
            })
            .subscribe();

        return () => {
            Supabase.channel('any').unsubscribe();
        }
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

    return (
        <div>
            {
                !friendSpotifyAuth ? <Loading /> :
                <>
                    <div className="flex items-center justify-between p-2 mb-6">
                        <h3 className="text-xl me-2 pt-2">Controlling: <span><strong>{currentFriend.Username}</strong></span></h3>
                        <button className="btn btn-primary" onClick={() => setCurrentFriend(null)}><TiArrowBack size={25}/></button>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="btn-group">
                            <button className={`btn ${requestPageView == RequestPageView.Search ? "btn-active" : ""}`} onClick={() => setRequestPageView(RequestPageView.Search)}>Search</button>
                            <button className={`btn ${requestPageView == RequestPageView.YourPlaylists ? "btn-active" : ""}`} onClick={() => setRequestPageView(RequestPageView.YourPlaylists)}>Your Playlists</button>
                            <button className={`btn ${requestPageView == RequestPageView.TheirSession ? "btn-active" : ""}`} onClick={() => setRequestPageView(RequestPageView.TheirSession)}>Their Session</button>
                        </div>
                        <div className="w-full">
                            { currentView() }
                        </div>
                    </div>
                </>
            }
        </div>
    )
}

export default UserRequest;