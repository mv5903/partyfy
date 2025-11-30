import { useContext, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TiArrowBack } from "react-icons/ti";

import { SpotifyAuth } from "@/helpers/SpotifyAuth";
import UserContext from '@/providers/UserContext';
import { useAlert } from "@/hooks/useAlert";
import { useNavigationLoader } from "@/hooks/useNavigationLoader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQueueStatusStore } from "@/stores/useQueueStatusStore";

import BackgroundEffectColor from "@/helpers/BackgroundEffectColor";
import { getArtistList } from "@/helpers/SpotifyDataParser";
import { Supabase } from "@/helpers/SupabaseHelper";
import { getDeviceIdentifier } from "@/utils/deviceIdentifier";
import { sessions, Users } from "@prisma/client";
import { FastAverageColor } from 'fast-average-color';
import { FaList, FaMusic, FaQuestionCircle, FaSearch } from "react-icons/fa";
import PromotionalHeader from "../misc/PromotionalHeader";
import Search from "./tabs/Search";
import TheirSession from "./tabs/TheirSession";
import YourPlaylists from "./tabs/YourPlaylists";
// Using native title tooltip instead of reactstrap Tooltip to avoid requiring a target prop.

const RequestSong = ({ currentFriend, setCurrentFriend, temporarySession, exitSession, setShowFriendInTopBar, setQueueUsage: setParentQueueUsage } : { currentFriend: Users, setCurrentFriend: Function, temporarySession: sessions, exitSession: Function, setShowFriendInTopBar?: (show: boolean) => void, setQueueUsage?: (queueUsage: any) => void }) => {

    enum RequestPageView {
        Search,
        TheirSession,
        YourPlaylists
    }

    const alert = useAlert();
    const { startLoading, stopLoading } = useNavigationLoader();
    const { user } = useContext(UserContext);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setLoading, setSuccess, setError } = useQueueStatusStore();

    const [friendSpotifyAuth, setFriendSpotifyAuth] = useState<SpotifyAuth>(null);
    const [friendUserObject, setFriendUserObject] = useState<Users>(null);
    const [nowPlaying, setNowPlaying] = useState<any>(null);
    const [queueUsage, setQueueUsage] = useState<any>(null);

    // Callback ref for the tabs element to detect when it's hidden
    const [tabsElement, setTabsElement] = useState<HTMLDivElement | null>(null);

    // Get tab from URL params, default to Search
    const tabParam = searchParams.get('tab');
    const getRequestPageView = () => {
        if (tabParam === 'session') return RequestPageView.TheirSession;
        if (tabParam === 'playlists' && !temporarySession) return RequestPageView.YourPlaylists;
        return RequestPageView.Search;
    };
    const requestPageView = getRequestPageView();

    const setRequestPageView = (view: RequestPageView) => {
        const tabMap = {
            [RequestPageView.Search]: 'search',
            [RequestPageView.TheirSession]: 'session',
            [RequestPageView.YourPlaylists]: 'playlists'
        };
        const newTab = tabMap[view];
        const currentPath = window.location.pathname;

        // Preserve the session query parameter if it exists
        const sessionId = searchParams.get('session');
        const queryString = sessionId ? `tab=${newTab}&session=${sessionId}` : `tab=${newTab}`;

        router.push(`${currentPath}?${queryString}`, { scroll: false });
    };

    const RGBtoHSL = (r, g, b) => {
        r /= 255;
        g /= 255;
        b /= 255;
        const l = Math.max(r, g, b);
        const s = l - Math.min(r, g, b);
        const h = s
            ? l === r
                ? (g - b) / s
                : l === g
                    ? 2 + (b - r) / s
                    : 4 + (r - g) / s
            : 0;
        return [
            60 * h < 0 ? 60 * h + 360 : 60 * h,
            100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
            (100 * (2 * l - s)) / 2,
        ];
    };

    // IntersectionObserver to detect when tabs are hidden
    useEffect(() => {
        console.log('[DEBUG] IntersectionObserver effect running', {
            hasElement: !!tabsElement,
            hasCallback: !!setShowFriendInTopBar,
            currentFriend: currentFriend?.Username
        });

        if (!tabsElement || !setShowFriendInTopBar) {
            console.log('[DEBUG] Missing requirements, not setting up observer');
            return;
        }

        console.log('[DEBUG] Setting up observer on element:', tabsElement);

        const observer = new IntersectionObserver(
            ([entry]) => {
                console.log('[DEBUG] Intersection changed:', {
                    isIntersecting: entry.isIntersecting,
                    willShowFriend: !entry.isIntersecting,
                    boundingRect: entry.boundingClientRect.top
                });
                // When tabs are NOT intersecting (hidden), show friend in top bar
                setShowFriendInTopBar(!entry.isIntersecting);
            },
            {
                threshold: 0,
                rootMargin: '-80px 0px 0px 0px' // Trigger when tabs are 80px from top
            }
        );

        observer.observe(tabsElement);
        console.log('[DEBUG] Observer started observing');

        return () => {
            console.log('[DEBUG] Cleaning up observer');
            observer.disconnect();
        };
    }, [tabsElement, setShowFriendInTopBar, currentFriend]);

    useEffect(() => {
        loadFriendSpotifyAuth();
        unattendedQueuesAllowed();
        isTemporarySessionNotExpired();

        isStillFriends();

        const subscription = Supabase
            .channel('UserRequest')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Users' }, (payload: any) => {
                unattendedQueuesAllowed();
                isStillFriends();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Friends' }, (payload: any) => {
                unattendedQueuesAllowed();
                isStillFriends();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        }
    }, []);

    useEffect(() => {
        async function loadFriendUserObject() {
            const response = await fetch(`/api/database/users?UserID=${currentFriend.UserID}`);
            const data = await response.json();
            setFriendUserObject(data);
        }

        loadFriendUserObject();
        // Reduced from 1s to 10s - friend user object doesn't change frequently
        let timeout = setInterval(loadFriendUserObject, 10000);
        return () => clearInterval(timeout);
    }, [currentFriend])

    useEffect(() => {
        if (!currentFriend) return;

        getQueueUsage();
        // Update queue usage every 5 seconds
        let interval = setInterval(getQueueUsage, 5000);
        return () => clearInterval(interval);
    }, [currentFriend])

    // Handle loading state with navigation loader
    useEffect(() => {
        if (!friendSpotifyAuth) {
            startLoading();
        } else {
            stopLoading();
        }
    }, [friendSpotifyAuth, startLoading, stopLoading]);

    // Sync queueUsage to parent component
    useEffect(() => {
        if (setParentQueueUsage) {
            setParentQueueUsage(queueUsage);
        }
    }, [queueUsage, setParentQueueUsage]);

    async function loadFriendSpotifyAuth() {
        if (currentFriend && currentFriend.RefreshToken) {
            let friendSpotifyAuth = new SpotifyAuth(currentFriend.RefreshToken);
            setFriendSpotifyAuth(friendSpotifyAuth);
        } else {
            await alert.fire({
                title: 'No Spotify account linked',
                text: `Your friend ${currentFriend.Username} needs to link their Spotify account to account before you can request songs.`,
                icon: 'error',
            });
            setCurrentFriend(null);
        }
    }
    
    useEffect(() => {
        if (!friendSpotifyAuth) return;
        async function getNowPlaying() {
            try {
                let accessToken = await friendSpotifyAuth.getAccessToken();
                if (!accessToken) return;
                const response = await fetch('/api/spotify/nowplaying?access_token=' + accessToken);
                if (response.status == 204) setNowPlaying(false);
                const data = await response.json();

                // Decide background color based on album art
                let albumArt = null;
                if (!data?.item?.album?.images[0]?.url) return;
                albumArt = data.item.album.images[0].url;
                const fac = new FastAverageColor();
                fac.getColorAsync(albumArt).then(color => {
                    let rgb = color.value;
                    let [h, s, l] = RGBtoHSL(rgb[0], rgb[1], rgb[2]);
                    BackgroundEffectColor.setBackgroundEffectColor(h);
                });

                if (data) {
                    setNowPlaying(data);
                }
            } catch (e) {
                console.error(e);
            }
        }

        getNowPlaying();
        // Reduced from 1s to 5s - better balance between UX and API load
        let interval = setInterval(getNowPlaying, 5000);
        return () => clearInterval(interval);
    }, [friendSpotifyAuth]);    

    async function addToQueue(song: any) {
        console.log("SONG", song)
        let result = await alert.fire({
            title: 'Queue Confirmation',
            text: `You're about to add ${song.name}${song.explicit ? ' (Explicit Version)' : ''} by ${getArtistList(song.artists)} to ${currentFriend.Username}'s queue.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Add it!',
            cancelButtonText: 'Cancel',
            html: ` <div className="">
                        <img src="${song.album.images[0].url}" style="width: 6rem; margin-left: auto; margin-right: auto;"  />
                        <p style="margin-top: 10px;">You're about to add <strong>${song.name}${song.explicit ? ' (Explicit Version)' : ''} by ${getArtistList(song.artists)}</strong> to <i>${currentFriend.Username}</i>'s queue.</p>
                    </div>`
        });

        if (result.isConfirmed) {
            // Show non-blocking loading indicator in nav bar
            if (temporarySession) alert.showLoading();
            setLoading(song.name);

            // Optimistically decrement queue usage if there's a restriction
            if (queueUsage && queueUsage.hasRestriction && queueUsage.currentQueueCount < queueUsage.maxQueueCount) {
                setQueueUsage({
                    ...queueUsage,
                    currentQueueCount: queueUsage.currentQueueCount + 1
                });
            }

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

            const data = await response.json();
            if (temporarySession) alert.close();

            if (response.status == 201) {
                setError();
                // Revert optimistic update
                await getQueueUsage();
                await alert.fire({
                    title: 'Time Restricted',
                    text: `You cannot add songs to ${currentFriend.Username}'s queue because you have attempted to queue more songs than their enforced limit. ${data.name}.`,
                    icon: 'warning'
                });
                return;
            }

            // User attempts to queue to a free friend
            if (data && data.name && data.name === "Player command failed: Premium required") {
                setError();
                // Revert optimistic update
                await getQueueUsage();
                await alert.fire({
                    title: 'Error',
                    text: `You cannot add songs to ${currentFriend.Username}'s queue because they are using a free Spotify account. Encourage them to upgrade to Spotify Premium to enable this feature.`,
                    icon: 'error'
                });
                return;
            }

            // User attempts to queue when friend does not have an active Spotify session
            if (data && data.name && data.name === 'Not Found') {
                setError();
                // Revert optimistic update
                await getQueueUsage();
                await alert.fire({
                    title: 'Error',
                    text: `${song.name} may not have added to queue. ${currentFriend.Username} may have temporarily lost their internet connection. Try again in a few minutes.`,
                    icon: 'error'
                });
                return;
            }

            // User can successfully queue
            if (data && data.name && data.name === 'OK') {
                setSuccess(song.name);
                if (temporarySession) {
                    await alert.fire({
                        title: 'Success',
                        text: `${song.name} has been added to ${currentFriend.Username}'s queue successfully.`,
                        icon: 'success'
                    });
                }
                // Refresh queue usage to get accurate count from server
                await getQueueUsage();
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
                await alert.fire({
                    title: 'Notice',
                    text: `Your friend ${currentFriend.Username} has disabled remote queues. You will no longer be able to request songs until it has been turned back on.`,
                    icon: 'warning',
                    confirmButtonText: 'OK'
                });
                if (temporarySession) exitSession();
                else setCurrentFriend(null);
            }
        }
    }

    async function isStillFriends() {
        console.log("[DEBUG] Checking if still friends", { temporarySession, currentFriend });
        if (temporarySession) return;
        if (!currentFriend) return;
        const response = await fetch(`/api/database/friends?action=isFriend&UserID=${user.getUserID()}&FriendUserID=${currentFriend.UserID}`);
        const data = await response.json();

        if (!data) {
            setCurrentFriend(null);
            await alert.fire({
                title: 'Notice',
                text: `Your friend ${currentFriend.Username} has removed you from their friends list. You will no longer be able to request songs until they add you back.`,
                icon: 'warning'
            });
        }
    }

    async function isTemporarySessionNotExpired() {
        if (!temporarySession) return;
        const expirationDate = new Date(temporarySession.expiration_date);
        if (expirationDate < new Date()) {
            await alert.fire({
                title: 'Notice',
                text: `Your temporary session with ${currentFriend.Username} has expired. You will no longer be able to request songs until they create a new session.`,
                icon: 'warning'
            });
            setTimeout(exitSession, 3000);
        }
        // Make sure session still exists (wasn't deleted by friend)
        const response = await fetch(`/api/database/sessions?UserID=${currentFriend.UserID}`);
        const data = await response.json();
        if (!data) {
            await alert.fire({
                title: 'Notice',
                text: `Your friend ${currentFriend.Username} has ended the session. You will no longer be able to request songs until they create a new session.`,
                icon: 'warning'
            });
            setTimeout(exitSession, 3000);
        }
    }

    async function getQueueUsage() {
        if (!currentFriend) return;
        const deviceId = getDeviceIdentifier();
        const userId = temporarySession ? null : user.getUserID();

        const params = new URLSearchParams({
            FriendUserID: currentFriend.UserID,
            DeviceID: deviceId
        });

        if (userId) {
            params.append('UserID', userId);
        }

        const response = await fetch(`/api/database/queueusage?${params.toString()}`);
        const data = await response.json();

        if (data) {
            setQueueUsage(data);
        }
    }

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

    return (
        <div className="text-white">
            {friendSpotifyAuth && (
                <>
                    <div className="flex items-center justify-center place-content-center p-2 mb-2">
                        <h3 className={`text-xl pt-2 mb-2 text-white ${temporarySession ? '' : 'me-2'}`}>To <span><strong>{currentFriend.Username}</strong></span></h3>
                        {
                            !temporarySession &&
                            <Button onClick={() => setCurrentFriend(null)}><TiArrowBack size={25}/></Button>
                        }
                    </div>
                    {
                        temporarySession && <PromotionalHeader />
                        
                    }
                    {
                        temporarySession &&
                        (expirationDate.getFullYear() == 2200 ? (
                            <h3 className="text-center mb-4 text-white"><i>Session never expires.</i></h3>
                        ) : (
                            <h3 className="text-center mb-4 text-white">Session expires on {expirationDate.toLocaleDateString()} at {expirationDate.toLocaleTimeString()}</h3>
                        ))
                    }
                    {
                        queueUsage && queueUsage.hasRestriction && (
                            <div className="text-center mb-4 text-white flex justify-center items-center gap-1">
                                {queueUsage.timeUntilNextQueue ? (
                                    <h3 className="text-yellow-400">
                                        <strong>{queueUsage.timeUntilNextQueue}</strong> remaining until your next queue
                                    </h3>
                                ) : (
                                    <h3>
                                        <strong>{queueUsage.maxQueueCount - queueUsage.currentQueueCount}</strong> of <strong>{queueUsage.maxQueueCount}</strong> queues remaining
                                    </h3>
                                )}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <div className="inline-block ml-1 cursor-pointer">
                                            <FaQuestionCircle className="text-stone-400" size={16} />
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="bg-stone-800 text-white text-sm border-0 text-center me-2">
                                        <p>{currentFriend.Username} has enabled a queue limit for their session.</p>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )
                    }
                    <div className="flex flex-col items-center">
                        <Tabs value={requestPageView.toString()} onValueChange={(value: string) => setRequestPageView(parseInt(value))} className={`w-full`}>
                            <TabsList ref={setTabsElement} className="grid w-full bg-stone-800 text-white" style={{ gridTemplateColumns: temporarySession ? '1fr 1fr' : '1fr 1fr 1fr' }}>
                                <TabsTrigger value={RequestPageView.Search.toString()} className="flex place-items-center gap-2 data-[state=active]:bg-stone-700 data-[state=active]:text-white text-stone-300">
                                    <FaSearch size={10} />Search
                                </TabsTrigger>
                                {
                                    !temporarySession &&
                                    <TabsTrigger value={RequestPageView.YourPlaylists.toString()} className="flex place-items-center gap-2 data-[state=active]:bg-stone-700 data-[state=active]:text-white text-stone-300">
                                        <FaList size={10} />Your Music
                                    </TabsTrigger>
                                }
                                <TabsTrigger value={RequestPageView.TheirSession.toString()} className="flex place-items-center gap-2 data-[state=active]:bg-stone-700 data-[state=active]:text-white text-stone-300">
                                    <FaMusic size={10}/>Session
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value={RequestPageView.Search.toString()} className="w-full">
                                <Search you={temporarySession ? currentFriend : user} spotifyAuth={temporarySession ? friendSpotifyAuth : user.spotifyAuth} addToQueue={addToQueue} isTemporarySession={temporarySession != null} />
                            </TabsContent>
                            {
                                !temporarySession &&
                                <TabsContent value={RequestPageView.YourPlaylists.toString()} className="w-full">
                                    <YourPlaylists you={user.db} spotifyAuth={user.spotifyAuth} addToQueue={addToQueue} />
                                </TabsContent>
                            }
                            <TabsContent value={RequestPageView.TheirSession.toString()} className="w-full">
                                <TheirSession friendSpotifyAuth={friendSpotifyAuth} friend={currentFriend} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </>
            )}
            <alert.AlertComponent />
        </div>
    )
}

export default RequestSong;