import { PartyfyProductType } from "@/helpers/PartyfyProductType";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import { getArtistList } from "@/helpers/SpotifyDataParser";
import { Supabase } from "@/helpers/SupabaseHelper";
import { RollingPeriod } from "@/prisma/UserOptions";
import UserContext from '@/providers/UserContext';
import { Users } from "@prisma/client";
import { useContext, useEffect, useState } from "react";
import { FaCog, FaSave } from "react-icons/fa";
import { TiArrowBack } from "react-icons/ti";
import Swal from 'sweetalert2/dist/sweetalert2.js';
import Loading from "../misc/Loading";
import LoadingDots from "../misc/LoadingDots";
import ScrollingText from "../misc/ScrollingText";
import UserRequest from "./UserRequest";

const RequestPage = () => {
    const { user } = useContext(UserContext);

    const [isUnattendedQueuesEnabled, setIsUnattendedQueuesEnabled] = useState(null);
    const [friendsList, setFriendsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFriend, setCurrentFriend] = useState<Users>(null);
    const [uqLoading, setUQLoading] = useState(false);
    const [spotifyStatuses, setSpotifyStatuses] = useState<any>([]);
    const [refreshingFriendsLoading, setRefreshingFriendsLoading] = useState(false);
    const [commercialOptionsVisible, setCommercialOptionsVisible] = useState(false);
    const [originalOptions, setOriginalOptions] = useState(null);
    const [hadQueueLimit, setHadQueueLimit] = useState(false);

    async function fetchFriends() {
        setRefreshingFriendsLoading(true);
        if (currentFriend) return;
        const response = await fetch('/api/database/friends?UserID=' + user.getUserID())
        let data = await response.json();
        // Show users who have functionality enabled first
        data = data.sort((a: any, b: any) => b.UnattendedQueues - a.UnattendedQueues);
        setRefreshingFriendsLoading(false);
        setLoading(false);
        setFriendsList(data);
    }
    async function fetchUQStatus() {
        if (currentFriend) return;
        const response = await fetch('/api/database/unattendedqueues?UserID=' + user.getUserID());
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
        fetch('api/database/users?UserID=' + user.getUserID())
            .then(response => response.json())
            .then(data => {
                if (data && data.options) {
                    const options = data.options;
                    if (options.queueLimitTimeRestriction) {
                        setQueueLimitEnabled(true);
                        setMaxQueueCount(options.queueLimitTimeRestriction.maxQueueCount);
                        setIntervalValue(options.queueLimitTimeRestriction.intervalValue);
                        setIntervalUnit(options.queueLimitTimeRestriction.intervalUnit);
                        setHadQueueLimit(true);
                    } else {
                        setHadQueueLimit(false);
                        setMaxQueueCount(0);
                        setIntervalValue(0);
                        setIntervalUnit(RollingPeriod.HOUR);
                        setQueueLimitEnabled(false);
                    }
                    setOriginalOptions(options);

                }
            });
    }, [commercialOptionsVisible]);     
    

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
                UserID: user.getUserID(),
                enable: !isUnattendedQueuesEnabled
            })
        });
        setUQLoading(false);
        if (response.ok) {
            setIsUnattendedQueuesEnabled(!isUnattendedQueuesEnabled);
        }
    }

    const [maxQueueCount, setMaxQueueCount] = useState(5);
    const [intervalValue, setIntervalValue] = useState(1);
    const [intervalUnit, setIntervalUnit] = useState<RollingPeriod>(RollingPeriod.HOUR);
    const [queueLimitEnabled, setQueueLimitEnabled] = useState(false);
    
    if (commercialOptionsVisible) {
        const saveCommercialOptions = () => {
            // Save the commercial options
            if (queueLimitEnabled && maxQueueCount < 1 || intervalValue < 1) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Please enter a value greater than 0 for both fields.',
                    icon: 'error'
                });
                return;
            }
            
            Swal.fire({
                title: 'Are you sure?',
                text: 'This will save your selected options.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, save it!',
                cancelButtonText: 'No, cancel!',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Saving...',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        allowEnterKey: false,
                        showConfirmButton: false,
                        willOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    const response = await fetch('/api/database/users', {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            UserID: user.getUserID(),
                            setOptions: 
                                queueLimitEnabled === true
                                ?
                                JSON.stringify({
                                    queueLimitTimeRestriction: {
                                        maxQueueCount,
                                        intervalValue,
                                        intervalUnit
                                    }
                                })
                                :
                                JSON.stringify({})
                        })
                    });
                    if (response.ok) {
                        Swal.fire({
                            title: 'Saved!',
                            text: 'Your commercial options have been saved.',
                            icon: 'success'
                        });
                        setHadQueueLimit(queueLimitEnabled);
                        if (queueLimitEnabled) {
                            setOriginalOptions({
                                queueLimitTimeRestriction: {
                                    maxQueueCount,
                                    intervalValue,
                                    intervalUnit
                                }
                            })
                        }
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: 'There was an error saving your commercial options.',
                            icon: 'error'
                        });
                    }
                }
            
            })
        }


        return (
            <div className="my-4">
                <div className="text-center">
                    <h3 className="text-2xl font-semibold text-white mb-3">Commercial Options</h3>
                    <div className="card p-3 w-[90%] mx-auto">
                        <div className="flex justify-center gap-8">
                            <h4 className="text-xl font-semibold text-white mb-3">Queue Limit</h4>
                            <input type="checkbox" className="switch switch-lg" checked={queueLimitEnabled} onChange={() => setQueueLimitEnabled(!queueLimitEnabled)} />
                        </div>

                        <p className="text-gray-400">Set the maximum number of songs that can be added to your queue through Partyfy in a given time period (rolling), via your friends or the QR code method.</p>
                        {/* <p className="text-gray-400">This functionality is not guranteed if someone queues using a private browser window without an account.</p> */}
                        <div className={`${queueLimitEnabled === false && 'blur-sm'}`}>
                            <div>
                                <label className="block text-white mt-4 mb-2">Maximum Songs</label>
                                <input minLength={1} required type="number" className="input" value={maxQueueCount} onChange={e => setMaxQueueCount((e as any).target.value)} />
                            </div>
                            <div>
                                <label className="block text-white mt-4 mb-2">Per Time Period of</label>
                                <div className="flex justify-around">
                                    <input minLength={1} required type="number" className="input" value={intervalValue} onChange={e => setIntervalValue((e as any).target.value)} />
                                    <select onChange={e => setIntervalUnit((e as any).target.value)} value={intervalUnit} className="input">
                                        <option value="minute">Minute(s)</option>
                                        <option value="hour">Hour(s)</option>
                                        <option value="day">Day(s)</option>
                                        <option value="week">Week(s)</option>
                                        <option value="month">Month(s)</option>
                                        <option value="year">Year(s)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-[5%] flex justify-center gap-12 w-full">
                        <button className="btn btn-primary" onClick={() => {
                            let options = { maxQueueCount, intervalValue, intervalUnit };

                            function confirmBackPress() {
                                Swal.fire({
                                    title: 'Are you sure?',
                                    text: 'You have unsaved changes. Are you sure you want to go back?',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: 'Yes, go back!',
                                    cancelButtonText: 'No, cancel!'
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        setCommercialOptionsVisible(false);
                                    }
                                });
                            }

                            if (hadQueueLimit == queueLimitEnabled)  {
                                setCommercialOptionsVisible(false);
                                return;
                            }

                            if ( hadQueueLimit != queueLimitEnabled ) {
                                confirmBackPress();
                                return; 
                            } 
                                
                            else if (originalOptions.queueLimitTimeRestriction.maxQueueCount != options.maxQueueCount 
                                || originalOptions.queueLimitTimeRestriction.intervalValue != options.intervalValue 
                                || originalOptions.queueLimitTimeRestriction.intervalUnit != options.intervalUnit)
                                {
                                    confirmBackPress();
                                    return;
                                }
                        
                            else setCommercialOptionsVisible(false);
                    
                        }}><TiArrowBack size={25}/></button>
                        <button className="btn btn-success" onClick={() => saveCommercialOptions()}><FaSave className="mr-2" /> Save</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-6">
            {
                !currentFriend &&
                <>
                    <div className="text-center">
                        {
                            isUnattendedQueuesEnabled === null || uqLoading
                            ?
                            <div className="h-[10vh]">
                                <LoadingDots className="mt-4" />
                            </div>
                            :
                            <div className="h-[10vh]">
                                <div className="flex justify-center place-items-center">
                                    <button className={`btn m-2 ${isUnattendedQueuesEnabled ? "btn-success" : "btn-warning"}`} onClick={() => unattendedQueues()}>{isUnattendedQueuesEnabled ? "Unattended Queues: Enabled" : "Unattended Queues: Disabled"}</button>
                                    {
                                        user && user.db && user.getProductType() === PartyfyProductType.COMMERCIAL && isUnattendedQueuesEnabled &&
                                        <button className="btn btn-primary p-2 px-4" onClick={() => setCommercialOptionsVisible(true)}><FaCog /></button>
                                    }
                                </div>
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
                    <div>
                        <h6 className="text-sm text-gray-400 mb-6 cursor-pointer" onClick={() => fetchFriends()}>
                            {
                                refreshingFriendsLoading === true
                                ?
                                <div className="mt-5">
                                    <LoadingDots />
                                </div>
                                :
                                <i>Tap here to refresh</i>
                            }
                        </h6>
                        <h3>No friends found. Add some through the friends menu.</h3>
                    </div>
                }
                {
                    !currentFriend && !loading && friendsList.length > 0 &&
                    <div className="p-2">
                        <h3 className="text-2xl font-semibold text-white mb-3">Add to:</h3>
                        <h6 className="text-sm text-gray-400 mb-6 cursor-pointer" onClick={() => fetchFriends()}>
                            {
                                refreshingFriendsLoading === true
                                ?
                                <div className="mt-5">
                                    <LoadingDots />
                                </div>
                                :
                                <i>Tap here to refresh</i>
                            }
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
                                                {friendIsActive && (
                                                    <div className="flex items-center max-w-[50%]">
                                                        <span className={`inline-block w-2 h-2 ${!isQueueEnabled ? 'bg-red-500' : isPodcast ? 'bg-yellow-500' : 'bg-green-500'} rounded-full mr-2`}></span>
                                                        <span className="text-xs text-gray-300 max-w-[87%] truncate">
                                                            {
                                                                isPodcast
                                                                ?
                                                                'Podcast Episode'
                                                                :
                                                                <ScrollingText text={`${friendNowPlayingStatus.data.item.name} - ${getArtistList(friendNowPlayingStatus.data.item.artists)}`}/>
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                                 {!friendIsActive && !isQueueEnabled && (
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
                    <UserRequest currentFriend={currentFriend} setCurrentFriend={setCurrentFriend} temporarySession={null} exitSession={null} />
                }
            </div>
        </div>
    );
}

export default RequestPage;