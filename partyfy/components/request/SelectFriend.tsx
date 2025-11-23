import BackgroundEffectColor from "@/helpers/BackgroundEffectColor";
import { PartyfyProductType } from "@/helpers/PartyfyProductType";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import { getArtistList } from "@/helpers/SpotifyDataParser";
import { Supabase } from "@/helpers/SupabaseHelper";
import { RollingPeriod } from "@/prisma/UserOptions";
import UserContext from '@/providers/UserContext';
import { Users } from "@prisma/client";
import { useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FaCog, FaSave } from "react-icons/fa";
import { TiArrowBack } from "react-icons/ti";
import { useAlert } from "@/hooks/useAlert";
import { useNavigationLoader } from "@/hooks/useNavigationLoader";
import Loading from "../misc/Loading";
import LoadingDots from "../misc/LoadingDots";
import ScrollingText from "../misc/ScrollingText";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FaArrowRotateRight } from "react-icons/fa6";
import { useFriendsStore } from "@/stores/useFriendsStore";
import { useUnattendedQueuesStore } from "@/stores/useUnattendedQueuesStore";

const SelectFriend = () => {
    const { user } = useContext(UserContext);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const alert = useAlert();
    const { startLoading, stopLoading } = useNavigationLoader();

    // Use Zustand store for friends data
    const { friends: friendsList, spotifyStatuses, isLoading: loading, isRefreshing: refreshingFriendsLoading, fetchFriends, updateSpotifyStatuses } = useFriendsStore();

    // Use Zustand store for unattended queues status
    const { isEnabled: isUnattendedQueuesEnabled, isLoading: uqLoading, fetchStatus: fetchUQStatus, updateStatus: updateUQStatus } = useUnattendedQueuesStore();
    const [commercialOptionsVisible, setCommercialOptionsVisible] = useState(false);
    const [originalOptions, setOriginalOptions] = useState(null);
    const [hadQueueLimit, setHadQueueLimit] = useState(false);

    async function getFriendPlayingStatus() {
        if (friendsList.length === 0) return;

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

            // Update the Zustand store with the new statuses
            updateSpotifyStatuses(results);
        } catch (error) {
            console.error('Error fetching playing statuses:', error);
        }
    }

    useEffect(() => {
        BackgroundEffectColor.removeBackgroundEffectColor();
        getFriendPlayingStatus();
        // Reduced from 10s to 15s for better performance
        const interval = setInterval(getFriendPlayingStatus, 15000);
        return () => clearInterval(interval);
    }, [friendsList]);

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
        // Fetch friends using Zustand store (will use cache if available)
        fetchFriends(user.getUserID());
        fetchUQStatus(user.getUserID());

        Supabase
            .channel('RequestPage')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends' }, (payload: any) => {
                fetchFriends(user.getUserID(), false);
                fetchUQStatus(user.getUserID(), false);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Users' }, (payload: any) => {
                fetchFriends(user.getUserID(), false);
                fetchUQStatus(user.getUserID(), false);
            })
            .subscribe();

        return () => {
            Supabase.channel('RequestPage').unsubscribe();
        }
    }, []);

    async function unattendedQueues() {
        // Use the store's updateStatus method which handles loading state and caching
        await updateUQStatus(user.getUserID(), !isUnattendedQueuesEnabled);
    }

    const [maxQueueCount, setMaxQueueCount] = useState(5);
    const [intervalValue, setIntervalValue] = useState(1);
    const [intervalUnit, setIntervalUnit] = useState<RollingPeriod>(RollingPeriod.HOUR);
    const [queueLimitEnabled, setQueueLimitEnabled] = useState(false);

    const saveCommercialOptions = async (silent = false) => {
        // Save the commercial options
        if (queueLimitEnabled && (maxQueueCount < 1 || intervalValue < 1)) {
            if (!silent) {
                await alert.fire({
                    title: 'Error!',
                    text: 'Please enter a value greater than 0 for both fields.',
                    icon: 'error'
                });
            }
            return false;
        }

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
            return true;
        } else {
            if (!silent) {
                await alert.fire({
                    title: 'Error!',
                    text: 'There was an error saving your commercial options.',
                    icon: 'error'
                });
            }
            return false;
        }
    };

    if (commercialOptionsVisible) {


        return (
            <div className="my-4">
                <div className="text-center">
                    <h3 className="text-2xl font-semibold text-white mb-3">Commercial Options</h3>
                    <Card className="p-3 w-[90%] mx-auto bg-stone-800 border-stone-700">
                        <CardContent className="pt-6">
                            <div className="flex justify-center gap-8 items-center">
                                <Label htmlFor="queue-limit-toggle" className="text-xl font-semibold text-white mb-0">Queue Limit</Label>
                                <Switch id="queue-limit-toggle" checked={queueLimitEnabled} onCheckedChange={setQueueLimitEnabled} className="scale-125" />
                            </div>

                            <p className="text-gray-400 mt-4">Set the maximum number of songs that can be added to your queue through Partyfy in a given time period (rolling), via your friends or the QR code method.</p>
                            {/* <p className="text-gray-400">This functionality is not guranteed if someone queues using a private browser window without an account.</p> */}
                            <div className={`${queueLimitEnabled === false && 'blur-sm'}`}>
                                <div className="mt-4">
                                    <Label htmlFor="max-songs" className="block text-white mb-2">Maximum Songs</Label>
                                    <Input id="max-songs" min={1} required type="number" value={maxQueueCount} onChange={e => setMaxQueueCount((e as any).target.value)} className="bg-stone-900 border-stone-700 text-white" />
                                </div>
                                <div className="mt-4">
                                    <Label className="block text-white mb-2">Per Time Period of</Label>
                                    <div className="flex gap-4">
                                        <Input min={1} required type="number" value={intervalValue} onChange={e => setIntervalValue((e as any).target.value)} className="bg-stone-900 border-stone-700 text-white" />
                                        <select
                                            onChange={e => setIntervalUnit((e as any).target.value)}
                                            value={intervalUnit}
                                            className="flex h-9 w-full rounded-md border border-stone-700 bg-stone-900 text-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                        >
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
                        </CardContent>
                    </Card>
                    <div className="absolute bottom-[5%] flex justify-center gap-12 w-full">
                        <Button onClick={async () => {
                            let options = { maxQueueCount, intervalValue, intervalUnit };

                            // Check if there are any changes
                            const hasChanges =
                                hadQueueLimit !== queueLimitEnabled ||
                                (queueLimitEnabled && originalOptions?.queueLimitTimeRestriction && (
                                    originalOptions.queueLimitTimeRestriction.maxQueueCount != options.maxQueueCount ||
                                    originalOptions.queueLimitTimeRestriction.intervalValue != options.intervalValue ||
                                    originalOptions.queueLimitTimeRestriction.intervalUnit != options.intervalUnit
                                ));

                            // If there are changes, save silently with loading indicator
                            if (hasChanges) {
                                startLoading();
                                await saveCommercialOptions(true);
                                stopLoading();
                            }

                            // Close the panel
                            setCommercialOptionsVisible(false);
                        }}><TiArrowBack size={25}/></Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grow h-full flex flex-col overflow-hidden">
            <div className="text-center flex-shrink-0">
                {
                    isUnattendedQueuesEnabled === null || uqLoading
                    ?
                    <div className="h-[10vh]">
                        <LoadingDots className="mt-4" />
                    </div>
                    :
                    <div className="h-[10vh]">
                        <div className="flex justify-center place-items-center">
                            <Button
                                variant={isUnattendedQueuesEnabled ? "success" : "warning"}
                                className="m-2"
                                onClick={() => unattendedQueues()}
                            >
                                {isUnattendedQueuesEnabled ? "Remote Queues: Enabled" : "Remote Queues: Disabled"}
                            </Button>
                            {
                                user && user.db && user.getProductType() === PartyfyProductType.COMMERCIAL && isUnattendedQueuesEnabled &&
                                <Button className="p-2 px-4" onClick={() => setCommercialOptionsVisible(true)}><FaCog /></Button>
                            }
                        </div>
                        <p className="text-gray-400 mt-2">{isUnattendedQueuesEnabled ? "Your friends can add to your queue." : "Your friends cannot add to your queue."}</p>
                    </div>
                }
            </div>
            <div className="flex items-center m-4 flex-shrink-0">
                <Separator className="flex-1" />
                <span className="px-4 text-muted-foreground">OR</span>
                <Separator className="flex-1" />
            </div>
            <div className="flex-1 text-center mx-2 flex flex-col gap-3 overflow-hidden">
                {
                    loading && friendsList.length === 0 &&
                    <Loading />
                }
                {isPending && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center">
                        <Loading />
                    </div>
                )}
                {
                    !loading && friendsList.length === 0 &&
                    <div>
                        <h6 className="text-sm text-gray-400 mb-6 cursor-pointer" onClick={() => fetchFriends(user.getUserID())}>
                            {
                                refreshingFriendsLoading === true
                                &&
                                <div className="">
                                    <LoadingDots />
                                </div>
                            }
                        </h6>
                        <h3 className="mx-3">No friends found. Add some through the friends menu.</h3>
                    </div>
                }
                {
                    !loading && friendsList.length > 0 &&
                    <>
                        <h3 className="flex-shrink-0 text-2xl font-semibold text-white">Add to:</h3>
                        <h6 className="flex-shrink-0 text-sm text-gray-400 cursor-pointer" onClick={() => fetchFriends(user.getUserID())}>
                            {
                                refreshingFriendsLoading === true
                                &&
                                <LoadingDots />
                            }
                        </h6>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-3 min-h-0">
                            {
                                [...friendsList].sort((a, b) => {
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
                                            onClick={async () => {
                                                if (!friendIsActive) return;
                                                if (!isQueueEnabled) {
                                                    await alert.fire({
                                                        title: 'Error!',
                                                        text: `${friend.Username} does not have unattended queues enabled. Ask them to enable it if you want to queue songs.`,
                                                        icon: 'error'
                                                    });
                                                    return;
                                                }
                                                // Use transition for smoother navigation
                                                startTransition(() => {
                                                    router.push(`/request/${friend.UserID}`);
                                                });
                                            } }
                                            disabled={!friendIsActive || isPending}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition ease-in-out duration-300 text-white
                                                        ${isQueueEnabled && friendIsActive ? 'bg-stone-700 hover:bg-stone-600' : 'bg-stone-800'}
                                                        ${!isQueueEnabled || !friendIsActive ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="max-w-[50%] truncate">{friend.Username}</span>
                                                {friendIsActive && (
                                                    <div className="flex items-center max-w-[50%]">
                                                        <span className={`inline-block w-2 h-2 ${!isQueueEnabled ? 'bg-red-500' : 'bg-green-500'} rounded-full mr-2`}></span>
                                                        <span className="text-xs text-gray-300 max-w-[87%] truncate">
                                                            {
                                                                isPodcast
                                                                ?
                                                                <ScrollingText text={`${friendNowPlayingStatus.data.item.name} - ${friendNowPlayingStatus.data.item.show.publisher}`}/>
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
                    </>
                }
            </div>
            <alert.AlertComponent />
        </div>
    );
}

export default SelectFriend;