import { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useUser } from '@auth0/nextjs-auth0/client';
import { SpotifyAuth } from '@/helpers/SpotifyAuth';
import { CONSTANTS } from '@/assets/Constants';
import { getUserID } from '@/helpers/Utils';

import Head from 'next/head'
import Swal from 'sweetalert2/dist/sweetalert2.js';
import AnchorLink from '@/components/misc/AnchorLink'
import Loading from '@/components/misc/Loading';
import CurrentAlert from '@/components/misc/CurrentAlert';
import Dashboard from '@/components/Dashboard';
import UserQuickAction from '@/components/dropdowns/UserQuickAction';
import FriendsList from '@/components/dropdowns/friends/Friends';
import UserContext from '@/providers/UserContext';
import { FaSpotify } from 'react-icons/fa';
import UserRequest from '@/components/request/UserRequest';

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [ spotifyAuthenticated, setSpotifyAuthenticated ] = useState(null);
  const [isAHost, setIsAHost] = useState(null);
  const spotifyAuth = useRef();
  const spotifyAuthURL = CONSTANTS.SPOTIFY_AUTH_URL;
  const [ username, setUsername ] = useState(undefined);
  const [ activeTemporarySession, setActiveTemporarySession ] = useState(null);
  const [ temporarySessionFriend, setTemporarySessionFriend ] = useState(null);

  // Handles spotify authentication
  async function handleSpotifyAuth() {
    // Refresh token already in database
    const response = await fetch('/api/database/users?UserID=' + getUserID(user));
    const data = await response.json();
    if (data && data.RefreshToken && data.RefreshToken.length > 0) {
      if (spotifyAuth.current && spotifyAuth.current.RefreshToken && spotifyAuth.current?.RefreshToken != null) return true;
      let storedRefreshToken = data.RefreshToken;
      spotifyAuth.current = new SpotifyAuth(storedRefreshToken);
      spotifyAuth.current.accessToken = await spotifyAuth.current.refreshAccessToken();
      return true;
    }
    // No refresh token in database, then check for code in url
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      spotifyAuth.current = new SpotifyAuth();
      let data = await spotifyAuth.current.getRefreshToken(code);
      if (data && data.access_token && data.refresh_token) {
        spotifyAuth.current.accessToken = data.access_token;
        spotifyAuth.current.refreshToken = data.refresh_token;
        await fetch('/api/database/users', {
          method: 'PATCH',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              UserID: user?.sub ?? user?.user_id,
              RefreshToken: data.refresh_token
          })
        });
        window.location.href = window.location.origin;
      }
      return true;
    }
    return false;
  }

  useEffect(() => {
    if (user) {
      fetch('/api/database/users', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              UserID: user?.sub ?? user?.user_id,
          })
      });
      handleSpotifyAuth().then((result) => {
        setSpotifyAuthenticated(result || result === undefined);
      });  
    } 
  });

  async function checkUsername(username) {
    if (username.length < 1 || username.length > 16) return false;
    const response = await fetch('/api/database/username', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        UserID: user?.sub ?? user?.user_id,
        Username: username
      })
    })
    try {
      let data = await response.json();
      if ('duplicate' in data && data.duplicate) return false;
    } catch (e) {
      return false;
    }
    return true;
  }
  
  async function getUser() {
    if (user && user.sub) {
      const response = await fetch('/api/database/users?UserID=' + getUserID(user), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
      });
      if (response.status === 500) {
        Swal.fire({
          title: 'We\'re sorry...',
          text: 'Our database provider (Supabase) is currently experiencing issues. We apologize for any inconvenience. Please try again later.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }
      let data = await response.json();
      if (data && data.recordset) data = data.recordset[0];
      if (!data || !data.Username) {
        let enteredUsername = null;
        let { value: username } = await Swal.fire({
          title: 'Welcome! Please enter a username to get started.',
          input: 'text',
          inputLabel: 'Your username. Choose up to 16 characters.',
          inputPlaceholder: 'johndoe24',
          allowOutsideClick: false,
          allowEscapeKey: false
        })
        enteredUsername = username;
        let usernameOK = false;
        while (!usernameOK) {
          if (!(await checkUsername(enteredUsername))) {
            let alertTitle = enteredUsername.length > 16 ? 'Your username is too long.' : `${enteredUsername} is already taken. Please try another.`;
            let { value: userName } = await Swal.fire({
              title: alertTitle,
              input: 'text',
              inputLabel: 'Your username. Choose up to 16 characters.',
              inputPlaceholder: 'johndoe24',
              allowOutsideClick: false,
              allowEscapeKey: false
            })
            enteredUsername = userName;
          } else {
            usernameOK = true;
            setUsername(enteredUsername);
            return;
          }
        }
      }
      setUsername(data.Username);
    }
  }

  useEffect(() => {
    getUser();
  }, [user]);

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

  const refetchUser = () => { getUser() };

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
            <h2 className={`text-2xl m-3`}>{`${username ?? ''}`}</h2>
            <UserContext.Provider value={{ spotifyAuth: spotifyAuth.current, user, username }} >
              <div className="flex align-start">
                <FriendsList />
                <UserQuickAction user={user} isAHost={isAHost} setIsAHost={setIsAHost} setSpotifyAuthenticated={setSpotifyAuthenticated} getUser={refetchUser} />
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
                  <UserContext.Provider value={{ spotifyAuth: spotifyAuth.current, user, username }} >
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