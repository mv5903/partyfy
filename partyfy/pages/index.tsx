import { CONSTANTS } from '@/assets/Constants';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';

import Dashboard from '@/components/Dashboard';
import UserQuickAction from '@/components/dropdowns/UserQuickAction';
import FriendsList from '@/components/dropdowns/friends/Friends';
import AnchorLink from '@/components/misc/AnchorLink';
import Loading from '@/components/misc/Loading';
import UserRequest from '@/components/request/UserRequest';
import { PartyfyProductType } from '@/helpers/PartyfyProductType';
import PartyfyUser from '@/helpers/PartyfyUser';
import UserContext from '@/providers/UserContext';
import { sessions, Users } from '@prisma/client';
import Head from 'next/head';
import { FaSpotify } from 'react-icons/fa';
import Swal from 'sweetalert2/dist/sweetalert2.js';

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [ spotifyAuthenticated, setSpotifyAuthenticated ] = useState<boolean>(null);
  const [ isAHost, setIsAHost ] = useState<boolean>(true);
  const [ activeTemporarySession, setActiveTemporarySession ] = useState<sessions>(null);
  const [ temporarySessionFriend, setTemporarySessionFriend ] = useState<Users>(null);
  const [ partyfyUser, setPartyfyUser ] = useState<PartyfyUser>(null);
  
  const spotifyAuthURL = CONSTANTS.SPOTIFY_AUTH_URL;
  
  // Handles spotify authentication
  async function handleSpotifyAuth() {
    // Refresh token already in database
    let pUser = new PartyfyUser(user);
    setPartyfyUser(pUser);
    return await pUser.fillUserInfoFromDB();
  }

  // Normal User Handling
  useEffect(() => {
    if (user) {
      handleSpotifyAuth().then((result) => {
        setSpotifyAuthenticated(result || result === undefined);
      });  
    } 
  }, [user]);

  // Temporary Session Handling
  useEffect(() => {
    async function checkSession() {
      // Show Swal loading
      const urlParams = new URLSearchParams(window.location.search);
      const sessionID = urlParams.get('session');
      if (!sessionID) return;
      Swal.fire({
        title: 'Joining Session',
        text: 'Please wait while we check the session...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      let response = await fetch('/api/database/sessions?SessionID=' + sessionID)
      let data = await response.json();
      // Check if the session exists
      if (!data) {
        Swal.fire({
          title: 'Session Not Found',
          text: 'The session you tried to join does not exist. Ask your friend to create a new one.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }
      // Check if the session is active
      const expirationDate = new Date(data.expiration_date);
      if (expirationDate < new Date()) {
        Swal.fire({
          title: 'Session Expired',
          text: `The session you tried to join expired at ${expirationDate.toLocaleDateString()} at ${expirationDate.toLocaleTimeString()}. Ask your friend to create a new one.`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }
      // Get the friend's user info
      response = await fetch('/api/database/users?UserID=' + data.user_id);
      if (response.status === 500) return;
      let friendData = await response.json();
      if (!friendData) return;
      // Cancel Swal
      Swal.close();
      setTemporarySessionFriend(friendData);
      setActiveTemporarySession(data);
    }

    checkSession();
  }, []);

  function exitSession() {
    setActiveTemporarySession(null);
    setTemporarySessionFriend(null);
    // Change URL to just the URL without the params
    const url = new URL(window.location.href);
    const baseUrl = url.origin + url.pathname;
    window.location.href = baseUrl;
  }

  const refetchUser = async () => { 
    await partyfyUser.refetchUser();
    setPartyfyUser(partyfyUser);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Head>
        <title>Partyfy</title>
        <meta name="description" content="Queue songs to your friend's Spotify Queue Unattended" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {
        activeTemporarySession &&
        <div className='text-white text-center'>
          <UserRequest currentFriend={temporarySessionFriend} setCurrentFriend={null} temporarySession={activeTemporarySession} exitSession={exitSession} />
        </div>
      }
      { 
        !user && !activeTemporarySession &&
        <div className='mt-[25%]'>
          {/* <CurrentAlert /> */}
          <main className=''>
            <div className='flex justify-center'>
              <img className='object-center' src='/logo.png' width="200px" />
            </div>
            <h2 className='text-center m-4 text-4xl'>Welcome!</h2>
            <p className="text-center text-2xl m-3 leading-normal">Add to your friend's Spotify queue without accessing their session directly.</p>
            <div className='flex justify-center mt-8'>
              <AnchorLink
                href="/api/auth/login"
                className="btn btn-primary btn-margin text-center"
                tabIndex={0}
                testId="navbar-login-desktop" icon={null}>
                Get Started
              </AnchorLink>
            </div>
          </main> 
        </div>
      }
      {
        user && activeTemporarySession == null && <main className="text-left z-[2]">
          <nav className='flex justify-between'>
            <div className='flex justfiy-start place-items-center'>
              <h2 className={`text-2xl m-3`}>{`${partyfyUser?.db?.Username ?? ''}`}</h2>
              {
                user && partyfyUser && partyfyUser.db && partyfyUser.getProductType() == PartyfyProductType.COMMERCIAL &&
                <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              }
            </div>
            <UserContext.Provider value={{ user: partyfyUser }} >
              <div className="flex align-start">
                <FriendsList />
                <UserQuickAction isAHost={isAHost} setIsAHost={setIsAHost} setSpotifyAuthenticated={setSpotifyAuthenticated} getUser={refetchUser} />
              </div>
            </UserContext.Provider>
          </nav>
          { 
            spotifyAuthenticated === true
            ?
            <>
              { 
              user != null && 
              <div className="d-flex flex-column justify-content-center align-items-center">
                  <UserContext.Provider value={{ user: partyfyUser }} >
                    <Dashboard isAHost={isAHost} setIsAHost={setIsAHost}/> 
                  </UserContext.Provider>
              </div>
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
                    <AnchorLink
                      href={spotifyAuthURL}
                      className="btn btn-success btn-margin m-4 decoration-none"
                      icon={null}
                      testId="navbar-logout-mobile"
                      tabIndex={0}>
                      <FaSpotify className="mr-2" />
                      Authenticate Spotify
                    </AnchorLink>
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
      }
    </>
  )
}