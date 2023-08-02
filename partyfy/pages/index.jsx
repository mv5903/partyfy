import { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useUser } from '@auth0/nextjs-auth0/client';
import { SpotifyAuth } from '@/helpers/SpotifyAuth';
import { CONSTANTS } from '@/assets/Constants';
import { getUserID } from '@/helpers/Utils';

import Head from 'next/head'
import Swal from 'sweetalert2';
import AnchorLink from '@/components/misc/AnchorLink'
import Loading from '@/components/misc/Loading';
import Dashboard from '@/components/Dashboard';
import UserQuickAction from '@/components/dropdowns/UserQuickAction';
import FriendsList from '@/components/dropdowns/friends/Friends';
import UserContext from '@/providers/UserContext';

import styles from '@/styles/Home.module.css'

import logo from '@/public/logo.png';

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [ spotifyAuthenticated, setSpotifyAuthenticated ] = useState(null);
  const [isAHost, setIsAHost] = useState(null);
  const spotifyAuth = useRef();
  const spotifyAuthURL = CONSTANTS.SPOTIFY_AUTH_URL;
  const [ username, setUsername ] = useState(undefined);

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
      console.log(data);
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

  LoadAndGetUsername: useEffect(() => {
    async function f() {
      if (user && user.sub) {
        const response = await fetch('/api/database/users?UserID=' + getUserID(user), {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          }
        });
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

    f();
  }, [user]);

  
  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Head>
        <title>Partyfy</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      { 
        !user && <main className={styles.main}>
          <img src='/logo.png' width="200px" />
          <h2 className='text-center m-4'>Welcome!</h2>
          <p className={styles.description}>Add to your friend's Spotify queue without accessing their session directly.</p>
          <AnchorLink
            href="/api/auth/login"
            className="btn btn-primary btn-margin"
            tabIndex={0}
            testId="navbar-login-desktop" icon={null}>
            Get Started
          </AnchorLink>
        </main> 
      }
      {
        user && <main className={`${styles.main_loggedin} `}>
          <nav className='d-flex flex-row justify-content-between'>
            <h4 className={`${styles.title} ms-2 mt-3`}>{`${username ?? ''}`}</h4>
            <UserContext.Provider value={{ spotifyAuth: spotifyAuth.current, user, username }} >
              <div className="d-flex flex-row" style={{ marginTop: `${isMobile ? '-3.5vh' : '-2vh'}`}}>
                <FriendsList />
                <UserQuickAction user={user} isAHost={isAHost} setIsAHost={setIsAHost} />
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
                <div className={`${styles.spotifylogin} d-flex flex-column justify-content-center align-items-center`}>
                  <h3 className="m-4">You're almost ready to party!</h3>
                  <p className="m-4 text-center" style={{ fontSize: isMobile ? '.5em' : '' }}>To get started, you'll need to authenticate your Spotify account.</p>
                    <AnchorLink
                      href={spotifyAuthURL}
                      className="btn btn-success btn-margin m-4 decoration-none"
                      icon={null}
                      testId="navbar-logout-mobile"
                      tabIndex={0}>
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