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
  const [ spotifyAuthenticated, setSpotifyAuthenticated ] = useState(false);
  const [isAHost, setIsAHost] = useState(null);
  const spotifyAuth = useRef();
  const spotifyAuthURL = CONSTANTS.SPOTIFY_AUTH_URL;
  const [ showLoading, setShowLoading ] = useState(false);
  const [ username, setUsername ] = useState(undefined);

  // Handles spotify authentication
  async function handleSpotifyAuth() {
    // Attempt to first get stored refresh token from session storage
    let storedRefreshToken = sessionStorage.getItem('spotifyRefreshToken');
    if (storedRefreshToken && !spotifyAuthenticated) {
      spotifyAuth.current = new SpotifyAuth('');
      spotifyAuth.current.refreshToken = storedRefreshToken;
      await spotifyAuth.current.refreshAccessToken();
      sessionStorage.setItem('spotifyAccessToken', spotifyAuth.current.accessToken);
      setSpotifyAuthenticated(true);
    }
    // Then, if no refresh token is stored, attempt to get refresh token from user in database
    if (!storedRefreshToken && user) {
      const response = await fetch('/api/database/users?UserID=' + (user.sub ?? user.user_id), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
      });
      let data = await response.json();
      console.log('data', data);
      if (data && data.RefreshToken) {
        spotifyAuth.current = new SpotifyAuth('');
        spotifyAuth.current.refreshToken = data.RefreshToken;
        console.log('refreshtoken', data.RefreshToken);
        await spotifyAuth.current.refreshAccessToken();
        sessionStorage.setItem('spotifyAccessToken', spotifyAuth.current.accessToken);
        sessionStorage.setItem('spotifyRefreshToken', spotifyAuth.current.refreshToken);
        setSpotifyAuthenticated(true);
      }
    }
    // Else, get a new refresh token from Spotify based on the code in the URL
    if (!spotifyAuthenticated || !spotifyAuth.current?.initialized) {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code && !storedRefreshToken) {
        spotifyAuth.current = new SpotifyAuth(code);
        await spotifyAuth.current.getRefreshToken();
        await spotifyAuth.current.refreshAccessToken();
        sessionStorage.setItem('spotifyAccessToken', spotifyAuth.current.accessToken);
        sessionStorage.setItem('spotifyRefreshToken', spotifyAuth.current.refreshToken);
        setSpotifyAuthenticated(true);
        return;
      } 
    }
    // Finally, if no refresh token is stored and no code is in the URL, show a login with Spotify button
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
      setShowLoading(true);
      handleSpotifyAuth();
      setShowLoading(false);
    } 
  }), [user];

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
      console.error(e);
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

  if (isLoading || showLoading) {
    return (
      <div>
        <Loading />
      </div>
    )
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
              { user != null && spotifyAuth.current?.accessToken != null &&
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
                showLoading
                ?
                <Loading />
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
            </>
          }
        </main>
      }
    </>
  )
}