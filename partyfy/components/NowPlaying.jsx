import { useEffect } from 'react';
import styles from '../styles/Dashboard.module.css';

export default function NowPlaying({ spotifyAuth, setSpotifyAuthenticated }) {

    useEffect(() => {
        const interval = setInterval(() => {
            if (!spotifyAuth || !spotifyAuth.accessToken) {
                setSpotifyAuthenticated(false);
            }
            fetch('/api/spotify/nowplaying?access_token=' + spotifyAuth.accessToken)
                .then((res) => res.json())
                .then((data) => {
                    console.log(data);
                }
            );
        }, 3000); 
        return () => clearInterval(interval);
    });

    return (
        <div className={styles.nowPlaying}>
            <h2 className="text-center">Now Playing</h2>
        </div>
    );
}