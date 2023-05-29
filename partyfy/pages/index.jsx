import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useRef, useState } from 'react';
import AnchorLink from '../components/AnchorLink'
import { CONSTANTS } from '../assets/Constants';
import Loading from '../components/Loading';
import { SpotifyAuth } from '../helpers/SpotifyAuth';
import Dashboard from '../components/Dashboard';
import UserContext from '../providers/UserContext';
import UserQuickAction from '../components/UserQuickAction';
import Swal from 'sweetalert2';
import FriendsList from '@/components/FriendsList';
import { isMobile } from 'react-device-detect';


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
    const response = await fetch('/api/database/users?UserID=' + (user.sub ?? user.user_id));
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
  }), [];

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

  useEffect(() => {
    async function f() {
      if (user && user.sub) {
        const response = await fetch('/api/database/users?UserID=' + (user.sub ?? user.user_id), {
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
              let { value: userName } = await Swal.fire({
                title: `${enteredUsername} is already taken. Please try another.`,
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
          <h2 className='text-center mb-4 ms-4 me-4'>Welcome to Partyfy!</h2>
          <p className={styles.description}>A controllable Spotify Party without the hassle of sharing a playlist.</p>
          <AnchorLink
            href="/api/auth/login"
            className="btn btn-primary btn-margin"
            tabIndex={0}
            testId="navbar-login-desktop" icon={null}>
            Log in
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
                <UserQuickAction isAHost={isAHost} setIsAHost={setIsAHost} />
              </div>
            </UserContext.Provider>
          </nav>
          { 
            spotifyAuthenticated
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
        </main>
      }
    </>
  )
}