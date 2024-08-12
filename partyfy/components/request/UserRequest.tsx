import { useContext, useEffect, useState } from "react";
import { TiArrowBack } from "react-icons/ti";

import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import UserContext from '@/providers/UserContext';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import Loading from "../misc/Loading";

import { getArtistList } from "@/helpers/SpotifyDataParser";
import { Supabase } from "@/helpers/SupabaseHelper";
import { getDeviceIdentifier } from "@/utils/deviceIdentifier";
import { sessions, Users } from "@prisma/client";
import { FaList, FaMusic, FaSearch } from "react-icons/fa";
import Search from "./tabs/Search";
import TheirSession from "./tabs/TheirSession";
import YourPlaylists from "./tabs/YourPlaylists";

const UserRequest = ({ currentFriend, setCurrentFriend, temporarySession, exitSession } : { currentFriend: Users, setCurrentFriend: Function, temporarySession: sessions, exitSession: Function }) => {

    enum RequestPageView {
        Search,
        TheirSession,
        YourPlaylists
    }

    const { user } = useContext(UserContext);

    const [friendSpotifyAuth, setFriendSpotifyAuth] = useState<SpotifyAuth>(null);
    const [requestPageView, setRequestPageView] = useState(RequestPageView.Search);
    const [friendUserObject, setFriendUserObject] = useState<Users>(null);

    useEffect(() => {
        async function loadFriendUserObject() {
            const response = await fetch(`/api/database/users?UserID=${currentFriend.UserID}`);
            const data = await response.json();
            setFriendUserObject(data);
        }

        loadFriendUserObject();
        let timeout = setInterval(loadFriendUserObject, 1000);
        return () => clearInterval(timeout);
    }, [currentFriend])


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
            html: `You're about to add <strong>${song.name}${song.explicit ? ' (Explicit Version)' : ''}</strong> by <i>${getArtistList(song.artists)}</i> to ${currentFriend.Username}'s queue.`,
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

            // Obtain device id
            const device_id = getDeviceIdentifier();

            const uri = song.uri;
            let friendAccessToken = await friendSpotifyAuth.getAccessToken();
            const response = await fetch('/api/spotify/queue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uri: uri,
                    UserID: temporarySession ? null : user.getUserID(),
                    FriendUserID: currentFriend.UserID,
                    DeviceID: device_id,
                    access_token: friendAccessToken
                })
            });

            if (response.status == 201) {
                const data = await response.json();
                Swal.fire({
                    title: 'Time Restricted',
                    html: `You cannot add songs to <strong>${currentFriend.Username}</strong>'s queue because you have attempted to queue more songs than their enforced limit. ${data.name}.`,
                    icon: 'warning'
                })
                return;
            }

            const data = await response.json(); // ERROR LINE
            // User attempts to queue to a free friend
            if (data && data.name && data.name === "Player command failed: Premium required") {
                Swal.fire({
                    title: 'Error',
                    html: `You cannot add songs to <strong>${currentFriend.Username}</strong>'s queue because they are using a free Spotify account. Encourage them to upgrade to Spotify Premium to enable this feature.`,
                    icon: 'error'
                })
            }

            // User attempts to queue when friend does not have an active Spotify session
            if (data && data.name && data.name === 'Not Found') {
                Swal.fire({
                    title: 'Error',
                    html: `${song.name} may not have added to queue. <strong>${currentFriend.Username}</strong> may have temporarily lost their internet connection. Try again in a few minutes.`,
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

    async function unattendedQueuesAllowed() {
        if (!currentFriend) return;
        const response = await fetch('/api/database/unattendedqueues?UserID=' + currentFriend.UserID);
        const data = await response.json();

        if (data) {
            if (!data.UnattendedQueues)  {
                // show warning and then exit when pressed ok
                await Swal.fire({
                    title: 'Notice',
                    html: `Your friend <strong>${currentFriend.Username}</strong> has disabled unattended queues. You will no longer be able to request songs until it has been turned back on.`,
                    icon: 'warning',
                    confirmButtonText: 'OK'
                });
                if (temporarySession) exitSession();
                else setCurrentFriend(null);
            }
        }
    }

    async function isStillFriends() {
        if (temporarySession) return;
        if (!currentFriend) return;
        const response = await fetch(`/api/database/friends?action=isFriend&UserID=${user.getUserID()}&FriendUserID=${currentFriend.UserID}`);
        const data = await response.json();
        
        if (!data) {
            setCurrentFriend(null);
            Swal.fire({
                title: 'Notice',
                html: `Your friend <strong>${currentFriend.Username}</strong> has removed you from their friends list. You will no longer be able to request songs until they add you back.`,
                icon: 'warning'
            })
        }
    }

    async function isTemporarySessionNotExpired() {
        if (!temporarySession) return;
        const expirationDate = new Date(temporarySession.expiration_date);
        if (expirationDate < new Date()) {
            Swal.fire({
                title: 'Notice',
                html: `Your temporary session with <strong>${currentFriend.Username}</strong> has expired. You will no longer be able to request songs until they create a new session.`,
                icon: 'warning'
            });
            setTimeout(exitSession, 3000);
        }
        // Make sure session still exists (wasn't deleted by friend)
        const response = await fetch(`/api/database/sessions?UserID=${currentFriend.UserID}`);
        const data = await response.json();
        if (!data) {
            Swal.fire({
                title: 'Notice',
                html: `Your friend <strong>${currentFriend.Username}</strong> has ended the session. You will no longer be able to request songs until they create a new session.`,
                icon: 'warning'
            });
            setTimeout(exitSession, 3000);
        }
    }

    useEffect(() => {
        loadFriendSpotifyAuth();
        unattendedQueuesAllowed();
        isTemporarySessionNotExpired();

        if (!temporarySession) isStillFriends();

        const subscription = Supabase
            .channel('UserRequest')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Users' }, (payload: any) => {
                unattendedQueuesAllowed();
                if (!temporarySession) isStillFriends();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends' }, (payload: any) => {
                unattendedQueuesAllowed();
                if (!temporarySession) isStillFriends();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        }
    }, []);

    if (temporarySession) {
        useEffect(() => {
            // Check if temporary session has expired every 10 seconds
            const interval = setInterval(() => {
                isTemporarySessionNotExpired();
            }, 10000);
    
            return () => clearInterval(interval);
        });
    }

    let expirationDate = temporarySession ? new Date(temporarySession.expiration_date) : null;

    const currentView = () => {
        switch (requestPageView) {
            case RequestPageView.Search:
                return <Search you={temporarySession ? currentFriend : user} spotifyAuth={temporarySession ? friendSpotifyAuth : user.spotifyAuth} addToQueue={addToQueue} isTemporarySession={temporarySession != null} />;
            case RequestPageView.TheirSession:
                return <TheirSession friendSpotifyAuth={friendSpotifyAuth} friend={currentFriend} />;
            case RequestPageView.YourPlaylists:
                return <YourPlaylists you={user.db} spotifyAuth={user.spotifyAuth} addToQueue={addToQueue} />;
        }
    }

    return (
        <div>
            {
                !friendSpotifyAuth ? <Loading /> :
                <>
                    <div className="flex items-center justify-between place-content-center p-2 mb-4">
                        <h3 className="text-xl me-2 pt-2 mb-2">Controlling: <span><strong>{currentFriend.Username}</strong></span></h3>
                        {
                            temporarySession 
                            ?
                            <button className="btn btn-error p-3" onClick={() => exitSession()}><TiArrowBack className="mr-2" size={25}/> Leave Session</button>
                            :
                            <button className="btn btn-primary" onClick={() => setCurrentFriend(null)}><TiArrowBack size={25}/></button>
                        }
                    </div>
                    {
                        temporarySession &&
                        <h3 className="text-center mb-4">Session expires on {expirationDate.toLocaleDateString()} at {expirationDate.toLocaleTimeString()}</h3>
                    }
                    {
                        friendUserObject && friendUserObject.options && friendUserObject.options["queueLimitTimeRestriction"] && friendUserObject.options["queueLimitTimeRestriction"].maxQueueCount > 0 &&
                        <h3 className="text-center mb-4">Important: Your friend has a queue limit of {friendUserObject.options["queueLimitTimeRestriction"].maxQueueCount} songs per {friendUserObject.options["queueLimitTimeRestriction"].intervalValue} {friendUserObject.options["queueLimitTimeRestriction"].intervalUnit}(s) per person. </h3>
                    }
                    <div className="flex flex-col items-center">
                        <div role="tablist" className="tabs tabs-boxed">
                            <button className={`tab flex place-items-center ${requestPageView == RequestPageView.Search ? "tab-active" : ""}`} onClick={() => setRequestPageView(RequestPageView.Search)}><FaSearch className="mr-2" size={10} />Search</button>
                            {
                                !temporarySession && 
                                <button className={`tab flex place-items-center ${requestPageView == RequestPageView.YourPlaylists ? "tab-active" : ""}`} onClick={() => setRequestPageView(RequestPageView.YourPlaylists)}><FaList className="mr-2" size={10} />Your Music</button>
                            }
                            <button className={`tab flex place-items-center ${requestPageView == RequestPageView.TheirSession ? "tab-active" : ""}`} onClick={() => setRequestPageView(RequestPageView.TheirSession)}><FaMusic className="mr-2" size={10}/>Session</button>
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