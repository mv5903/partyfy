'use client';

import AnchorLink from '@/components/misc/AnchorLink';
import Loading from '@/components/misc/Loading';
import NavigationBar from '@/components/layout/NavigationBar';
import SelectFriend from '@/components/request/SelectFriend';
import BackgroundEffectColor from '@/helpers/BackgroundEffectColor';
import PartyfyUser from '@/helpers/PartyfyUser';
import UserContext from '@/providers/UserContext';
import { CONSTANTS } from '@/assets/Constants';
import { OAuthRedirect } from '@/helpers/OAuthRedirect';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { FaSpotify } from 'react-icons/fa';
import { isMobile } from 'react-device-detect';
import { useAlert } from '@/hooks/useAlert';
import { useUserStore } from '@/stores/useUserStore';
import { Button } from '@/components/ui/button';

function DashboardContent() {
  const alert = useAlert();
  const { user, error, isLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState<boolean | null>(null);
  const [isAHost, setIsAHost] = useState<boolean>(true);

  // Capture OAuth code from URL before it gets stripped
  const spotifyCode = searchParams.get('code');

  // Use Zustand store instead of local state
  const { partyfyUser, initializeUser, refetchUser: refetchUserStore } = useUserStore();

  const handleSpotifyAuthClick = () => {
    // Store the current origin before redirecting to Spotify
    OAuthRedirect.storeOrigin();
    window.location.href = CONSTANTS.SPOTIFY_AUTH_URL;
  };

  // Handles spotify authentication using Zustand store
  async function handleSpotifyAuth(code?: string) {
    // Use cached user data from Zustand store, pass the OAuth code if present
    const hasSpotifyAuth = await initializeUser(user, code);
    return hasSpotifyAuth;
  }

  // Normal User Handling
  useEffect(() => {
    BackgroundEffectColor.removeBackgroundEffectColor();
    if (!user && !isLoading) {
      // Redirect unauthenticated users to landing page
      router.push('/');
      return;
    }

    if (user) {
      console.log('[Dashboard] Spotify code from URL:', spotifyCode);
      handleSpotifyAuth(spotifyCode || undefined).then((result) => {
        setSpotifyAuthenticated(result || result === undefined);
      });
    }
  }, [user, isLoading, router, spotifyCode]);

  // Dashboard-specific effects
  useEffect(() => {
    if (!partyfyUser) return;

    if (!isMobile) {
      if (localStorage.getItem('betterOnMobileNotification') === null) {
        alert.fire({
          title: 'Better on Mobile',
          text: 'Partyfy is designed with mobile in mind. We encourage you to use this site on your mobile device for a better experience.',
          icon: 'info',
          confirmButtonText: 'Ok'
        });
        localStorage.setItem('betterOnMobileNotification', "true");
      }
    }

    // Store refresh token in database when user logs in
    if (partyfyUser.spotifyAuth?.refreshToken) {
      fetch('/api/database/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          UserID: partyfyUser.getUserID(),
          RefreshToken: partyfyUser.spotifyAuth.refreshToken
        })
      });
    }

    // Update last_login column in database
    fetch('/api/database/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        UserID: partyfyUser.getUserID(),
        last_login: true
      })
    })
      .then(res => res.json())
      .catch(err => console.log(err));
  }, [partyfyUser]);

  const refetchUser = async () => {
    await refetchUserStore();
  };

  // Only show loading if auth is still loading OR there's no user at all
  if (isLoading || !user) {
    return <Loading />;
  }

  return (
    <main className="text-left z-[2] flex flex-col h-screen">
      <NavigationBar
        partyfyUser={partyfyUser}
        isAHost={isAHost}
        setIsAHost={setIsAHost}
        setSpotifyAuthenticated={setSpotifyAuthenticated}
        getUser={refetchUser}
      />
      {
        spotifyAuthenticated === true
          ?
          <>
            {
              user != null && partyfyUser &&
              <UserContext.Provider value={{ user: partyfyUser }}>
                <SelectFriend />
              </UserContext.Provider>
            }
          </>
          :
          <>
            {
              spotifyAuthenticated === false &&
              <div className={`flex flex-col justify-center items-center mt-10`}>
                <h3 className="text-2xl m-4">You're almost ready to party!</h3>
                <h2 className="text-2xl m-4 text-center"><i>To get started, you'll need to link your Spotify account.</i></h2>
                <h6 className=''>You'll only have to do this once.</h6>
                <h4 className="text-1xl m-4 text-center">Please note that due to Spotify's API policy, friends will not be able to add to your queue if you link a free account. You can still queue to your friends, though, if they have premium.</h4>
                <Button 
                  onClick={handleSpotifyAuthClick}
                  className="bg-green-600 hover:bg-green-700 text-white btn-margin m-4 decoration-none"
                  tabIndex={0}

                >
                  <FaSpotify className="mr-2" />
                  Authenticate Spotify
                </Button>
              </div>
            }
            {
              spotifyAuthenticated === null &&
              <>
                <Loading />
              </>
            }
          </>
      }
      <alert.AlertComponent />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardContent />
    </Suspense>
  );
}
