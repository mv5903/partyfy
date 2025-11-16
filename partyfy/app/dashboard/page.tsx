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
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaSpotify } from 'react-icons/fa';
import { isMobile } from 'react-device-detect';
import Swal from 'sweetalert2/dist/sweetalert2.js';

export default function DashboardPage() {
  const { user, error, isLoading } = useUser();
  const router = useRouter();
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState<boolean | null>(null);
  const [isAHost, setIsAHost] = useState<boolean>(true);
  const [partyfyUser, setPartyfyUser] = useState<PartyfyUser | null>(null);

  const handleSpotifyAuthClick = () => {
    // Store the current origin before redirecting to Spotify
    OAuthRedirect.storeOrigin();
    window.location.href = CONSTANTS.SPOTIFY_AUTH_URL;
  };

  // Handles spotify authentication
  async function handleSpotifyAuth() {
    // Refresh token already in database
    let pUser = new PartyfyUser(user);
    setPartyfyUser(pUser);
    return await pUser.fillUserInfoFromDB();
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
      handleSpotifyAuth().then((result) => {
        setSpotifyAuthenticated(result || result === undefined);
      });
    }
  }, [user, isLoading, router]);

  // Dashboard-specific effects
  useEffect(() => {
    if (!partyfyUser) return;

    if (!isMobile) {
      if (localStorage.getItem('betterOnMobileNotification') === null) {
        Swal.fire({
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
    if (!partyfyUser) return;
    await partyfyUser.refetchUser();
    setPartyfyUser(partyfyUser);
  };

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
              user != null &&
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
                <button
                  onClick={handleSpotifyAuthClick}
                  className="btn btn-success btn-margin m-4 decoration-none"
                  tabIndex={0}>
                  <FaSpotify className="mr-2" />
                  Authenticate Spotify
                </button>
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
    </main>
  );
}
