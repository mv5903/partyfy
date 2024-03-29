import { useContext, useEffect, useState } from "react";
import { getUserID } from '@/helpers/Utils';
import UserContext from '@/providers/UserContext';
import Loading from "../misc/Loading";
import UserRequest from "./UserRequest";
import { Users } from "@prisma/client";
import { Supabase } from "@/helpers/SupabaseHelper";
import LoadingDots from "../misc/LoadingDots";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";

const RequestPage = () => {
    const {
        spotifyAuth,
        user
    } = useContext(UserContext);

    const [isUnattendedQueuesEnabled, setIsUnattendedQueuesEnabled] = useState(null);
    const [friendsList, setFriendsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFriend, setCurrentFriend] = useState<Users>(null);
    const [uqLoading, setUQLoading] = useState(false);
    const [spotifyStatuses, setSpotifyStatuses] = useState<any>([]);

    async function fetchFriends() {
        if (currentFriend) return;
        const response = await fetch('/api/database/friends?UserID=' + getUserID(user))
        let data = await response.json();
        // Show users who have functionality enabled first
        data = data.sort((a: any, b: any) => b.UnattendedQueues - a.UnattendedQueues);
        setLoading(false);
        setFriendsList(data);
    }
    async function fetchUQStatus() {
        if (currentFriend) return;
        const response = await fetch('/api/database/unattendedqueues?UserID=' + getUserID(user));
        const data = await response.json();
        if (data) {
            if (data.UnattendedQueues === null) {
                setIsUnattendedQueuesEnabled(false);
            } else {
                setIsUnattendedQueuesEnabled(data.UnattendedQueues);
            }
        }
    }

    async function getFriendPlayingStatus() {
        try {
            // Fetch the status for each friend
            const statusPromises = friendsList.map(async friend => {
                let spotifyAuth = new SpotifyAuth(friend.RefreshToken);
                let accessToken = await spotifyAuth.getAccessToken();
                if (!accessToken) return null;
    
                const response = await fetch(`/api/spotify/nowplaying?access_token=${accessToken}`);
                if (response.status === 204) return null;
    
                const data = await response.json();
                return data && data.is_playing ? { isActive: true, data, UserID: friend.UserID } : null;
            });
    
            // Wait for all promises to resolve and filter out nulls
            const results = (await Promise.all(statusPromises)).filter(status => status !== null);
    
            // Update the state with the new statuses
            setSpotifyStatuses(results);
        } catch (error) {
            console.error('Error fetching playing statuses:', error);
        }
    }

    useEffect(() => {
        getFriendPlayingStatus();
        const interval = setInterval(getFriendPlayingStatus, 10000);
        return () => clearInterval(interval);
    }, [currentFriend, friendsList]);
    

    useEffect(() => {
        fetchFriends();
        fetchUQStatus();

        Supabase
            .channel('RequestPage')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends' }, (payload: any) => {
                fetchFriends();
                fetchUQStatus();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Users' }, (payload: any) => {
                fetchFriends();
                fetchUQStatus();
            })
            .subscribe();

        return () => {
            Supabase.channel('RequestPage').unsubscribe();
        }
    }, []);

    async function unattendedQueues() {
        setUQLoading(true);
        const response = await fetch('/api/database/unattendedqueues', {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UserID: getUserID(user),
                enable: !isUnattendedQueuesEnabled
            })
        });
        setUQLoading(false);
        if (response.ok) {
            setIsUnattendedQueuesEnabled(!isUnattendedQueuesEnabled);
        }
    }

    return (
        <div className="my-12">
            {
                !currentFriend &&
                <>
                    <div className="text-center">
                        {
                            isUnattendedQueuesEnabled === null || uqLoading
                            ?
                            <div>
                                <LoadingDots className="mt-4" />
                            </div>
                            :
                            <div>
                                <button className={`btn m-2 ${isUnattendedQueuesEnabled ? "btn-success" : "btn-warning"}`} onClick={() => unattendedQueues()}>{isUnattendedQueuesEnabled ? "Unattended Queues: Enabled" : "Unattended Queues: Disabled"}</button>
                                <p className="text-gray-400 mt-2">{isUnattendedQueuesEnabled ? "Your friends can add to your queue." : "Your friends cannot add to your queue."}</p>
                            </div>
                        }
                    </div>
                    <div className="divider divider-horizontal m-4">OR</div>
                </>
            }
            <div className="text-center mt-4 ms-2 me-2">
                {
                    loading &&
                    <Loading />
                }
                {
                    !loading && friendsList.length === 0 &&
                    <h3>No friends found. Add some through the friends menu.</h3>
                }
                {
                    !currentFriend && !loading && friendsList.length > 0 &&
                    <div className="p-2">
                        <h3 className="text-2xl font-semibold text-white mb-3">Add to:</h3>
                        <h6 className="text-sm text-gray-400 mb-6 cursor-pointer" onClick={() => fetchFriends()}>
                            <i>Tap here to refresh</i>
                        </h6>
                        <div className="space-y-3">
                            {
                                [...friendsList] 
                                .sort((a, b) => {
                                    const aIsActive = spotifyStatuses?.some(status => status.UserID === a.UserID);
                                    const bIsActive = spotifyStatuses?.some(status => status.UserID === b.UserID);
                                    const aIsQueueEnabled = a.UnattendedQueues === true;
                                    const bIsQueueEnabled = b.UnattendedQueues === true;
                    
                                    // Sort active users with enabled queue to the top
                                    if (aIsActive && aIsQueueEnabled && (!bIsActive || !bIsQueueEnabled)) return -1;
                                    if (bIsActive && bIsQueueEnabled && (!aIsActive || !aIsQueueEnabled)) return 1;
                    
                                    // Among the remaining, sort active users to the top
                                    if (aIsActive && !bIsActive) return -1;
                                    if (bIsActive && !aIsActive) return 1;
                    
                                    // Lastly, sort users with enabled queue above those without
                                    if (aIsQueueEnabled && !bIsQueueEnabled) return -1;
                                    if (bIsQueueEnabled && !aIsQueueEnabled) return 1;
                    
                                    return a.Username.localeCompare(b.Username); // If all conditions are same, keep original order
                                }).map((friend, index) => {
                                    const friendIsActive = spotifyStatuses && spotifyStatuses.some(status => status.UserID === friend.UserID);
                                    const friendNowPlayingStatus = spotifyStatuses && spotifyStatuses.find(status => status.UserID === friend.UserID);
                                    const isQueueEnabled = friend.UnattendedQueues === true;
                                    const isPodcast = friendIsActive && isQueueEnabled && friendNowPlayingStatus.data.currently_playing_type && friendNowPlayingStatus.data.currently_playing_type === "episode";
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentFriend(friend)}
                                            disabled={!isQueueEnabled || !friendIsActive}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition ease-in-out duration-300
                                                        ${isQueueEnabled && friendIsActive ? 'bg-blue-600 hover:bg-blue-600' : 'bg-gray-700'}
                                                        ${!isQueueEnabled || !friendIsActive ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="max-w-[50%] truncate">{friend.Username}</span>
                                                {friendIsActive && isQueueEnabled && (
                                                    <div className="flex items-center max-w-[50%]">
                                                        <span className={`inline-block w-2 h-2 ${isPodcast ? 'bg-yellow-500' : 'bg-green-500'} rounded-full mr-2`}></span>
                                                        <span className="text-xs text-gray-300 max-w-[87%] truncate">
                                                            {
                                                                isPodcast
                                                                ?
                                                                'Podcast Episode'
                                                                :
                                                                `${friendNowPlayingStatus.data.item.name} - ${friendNowPlayingStatus.data.item.artists[0].name}`
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                                {!isQueueEnabled && (
                                                    <span className="text-xs text-gray-400 italic">not enabled</span>
                                                )}
                                                {!friendIsActive && isQueueEnabled && (
                                                    <span className="text-xs text-gray-400 italic">offline</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            }
                        </div>
                    </div>

                }
                {
                    currentFriend != null &&
                    <UserRequest currentFriend={currentFriend} setCurrentFriend={setCurrentFriend} />
                }
            </div>
        </div>
    );
}

export default RequestPage;