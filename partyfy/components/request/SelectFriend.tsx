import BackgroundEffectColor from "@/helpers/BackgroundEffectColor";
import { PartyfyProductType } from "@/helpers/PartyfyProductType";
import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import { getArtistList } from "@/helpers/SpotifyDataParser";
import { Supabase } from "@/helpers/SupabaseHelper";
import { RollingPeriod } from "@/prisma/UserOptions";
import UserContext from '@/providers/UserContext';
import { useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FaCog } from "react-icons/fa";
import { TiArrowBack } from "react-icons/ti";
import { useAlert } from "@/hooks/useAlert";
import ScrollingText from "../misc/ScrollingText";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useFriendsStore } from "@/stores/useFriendsStore";
import { useUnattendedQueuesStore } from "@/stores/useUnattendedQueuesStore";
import { SkeletonWrapper } from "@/components/ui/skeleton-wrapper";

const SelectFriend = ({ isLoading = false }: { isLoading?: boolean }) => {
    const { user } = useContext(UserContext);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const alert = useAlert();
    const { friends: friendsList, spotifyStatuses, isLoading: loading, isRefreshing: refreshingFriendsLoading, fetchFriends, updateSpotifyStatuses } = useFriendsStore();
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
        if (isLoading || !user) return;
        BackgroundEffectColor.removeBackgroundEffectColor();
        getFriendPlayingStatus();
        // Reduced from 10s to 15s for better performance
        const interval = setInterval(getFriendPlayingStatus, 5000);
        return () => clearInterval(interval);
    }, [friendsList, isLoading, user]);


    useEffect(() => {
        if (isLoading || !user) return;
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
    }, [commercialOptionsVisible, isLoading, user]);     
    

    useEffect(() => {
        if (isLoading || !user) return;
        fetchFriends(user.getUserID());
        fetchUQStatus(user.getUserID());

        Supabase
            .channel('RequestPage')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends' }, (payload: any) => {
                fetchFriends(user.getUserID(), false);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Users' }, (payload: any) => {
                if (payload.new?.Username == user.db.Username) return; // Skip if the change is for the current user to avoid unnecessary fetch
                fetchFriends(user.getUserID(), false);
            })
            .subscribe();

        return () => {
            Supabase.channel('RequestPage').unsubscribe();
        }
    }, [isLoading, user]);

    async function unattendedQueues() {
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

    // Show skeleton during initial page load OR while data is loading
    const showSkeleton = isLoading || (loading && friendsList.length === 0) || isUnattendedQueuesEnabled === null;

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

                            // If there are changes, save silently
                            if (hasChanges) {
                                await saveCommercialOptions(true);
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
            <h3 className="flex-shrink-0 text-2xl font-semibold text-white text-center w-full">To you:</h3>
            <div className="text-center flex-shrink-0 h-16 pt-2">
                <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex justify-center items-center">
                        <SkeletonWrapper isLoading={showSkeleton} skeletonClassName="h-10 w-64 rounded-md m-2">
                            <Button
                                variant={isUnattendedQueuesEnabled ? "success" : "warning"}
                                className="m-2 w-48"
                                onClick={() => unattendedQueues()}
                            >
                                {isUnattendedQueuesEnabled ? "Queues Allowed" : "Queues Not Allowed"}
                            </Button>
                        </SkeletonWrapper>
                        {!showSkeleton && user && user.db && user.getProductType() === PartyfyProductType.COMMERCIAL && isUnattendedQueuesEnabled && (
                            <Button className="p-2 px-4" onClick={() => setCommercialOptionsVisible(true)}>
                                <FaCog />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center m-4 flex-shrink-0">
                <Separator className="flex-1" />
                <span className="px-4 text-muted-foreground">OR</span>
                <Separator className="flex-1" />
            </div>
            <div className="flex-1 text-center mx-2 flex flex-col gap-3 overflow-hidden">
                <h3 className="flex-shrink-0 text-2xl font-semibold text-white">To your friends:</h3>
                <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-3 min-h-0">
                {
                    showSkeleton ? (
                        // Show skeleton friend items while loading
                        [...Array(8)].map((_, i) => (
                            <SkeletonWrapper key={i} isLoading={true}>
                                <button className="w-full text-left h-10 px-3 py-2 rounded-lg" />
                            </SkeletonWrapper>
                        ))
                    ) : friendsList.length === 0 ? (
                        <div>
                            <h3 className="mx-3 text-xl" id="no-friends-label">No friends yet!</h3>
                            <p className="text-gray-400 mt-2">Add some in the friends menu.</p>
                        </div>
                    ) : (
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
                                            onClick={() => {
                                                // Navigate immediately with view transition for smooth UX
                                                if (document.startViewTransition) {
                                                    document.startViewTransition(() => {
                                                        startTransition(() => {
                                                            router.push(`/request/@${friend.Username}`);
                                                        });
                                                    });
                                                } else {
                                                    startTransition(() => {
                                                        router.push(`/request/@${friend.Username}`);
                                                    });
                                                }
                                            }}
                                            onMouseEnter={() => {
                                                // Prefetch on hover for instant navigation
                                                if (friendIsActive && isQueueEnabled) {
                                                    router.prefetch(`/request/@${friend.Username}`);
                                                }
                                            }}
                                            disabled={!friendIsActive || !isQueueEnabled || isPending}
                                            className={`w-full text-left h-10 px-3 py-2 rounded-lg transition-all ease-in-out duration-150 text-white active:scale-[0.98]
                                                        ${isQueueEnabled && friendIsActive ? 'bg-stone-700 hover:bg-stone-600 active:bg-stone-500' : 'bg-stone-800'}
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
                    )
                }
                </div>
            </div>
            <alert.AlertComponent />
        </div>
    );
}

export default SelectFriend;