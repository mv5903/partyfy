import { useState, useEffect } from 'react';
import styles from '../styles/Dashboard.module.css';
import e from '../pages/assets/e.png';
import { fancyTimeFormat } from '@/pages/helpers/Utils';
import Loading from './Loading';
import UserContext from '../pages/providers/UserContext';
import { useContext } from 'react';

export default function NowPlaying() {

    const [nowPlaying, setNowPlaying] = useState(false);

    const {
        spotifyAuth,
        setSpotifyAuthenticated,
        user
    } = useContext(UserContext);

    useEffect(() => {
        const timer = 1000;
        const interval = setInterval(() => {
            if (!spotifyAuth || !spotifyAuth.accessToken) {
                setSpotifyAuthenticated(false);
            }
            fetch('/api/spotify/nowplaying?access_token=' + spotifyAuth.accessToken)
                .then(res => {
                    if (res.status === 204) {
                        setNowPlaying(false);
                        return;
                    }
                    return res.json();
                })
                .then((data) => {
                    console.log(data);
                    if (data) {
                        setNowPlaying(data);
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        }, timer); 
        return () => clearInterval(interval);
    }, []);

    if (!nowPlaying) {
        return (
            <div>
                <Loading/>
            </div>
        )
    }
    // Show progress bar as a value between 0 and 100
    let progress = nowPlaying.progress_ms / nowPlaying.item.duration_ms * 100;

    // Song titles do not need to include featuring artists as they are usually provided in the artist field anyway
    let songname = nowPlaying.item.name;
    const replacements = ['(feat.', '(with', '(Featuring']
    replacements.forEach((r) => {
        if (songname.includes(r)) {
            songname = songname.split(r)[0];
            return;
        }
    });

    return (
        <div className={styles.nowplaying}>
            <h3 className="text-center">Now Playing</h3>
            {
                nowPlaying 
                ?
                <div>
                    {/* Song Information */}
                    <div className={styles.songinfo}>
                        {
                            nowPlaying.item.explicit 
                            ?           
                            <div className="d-inline-flex flex-center">
                                <h3 className={styles.songname}><strong>{songname}</strong></h3>
                                <img className={`${styles.eicon} ms-3 mt-2`} src={e.src} alt="explicit"></img>
                            </div>
                            :
                            <h3 className={styles.songname}><strong>{songname}</strong></h3>
                        }
                        <h4>{nowPlaying.item.artists.map(artist => { return artist.name }).join(', ')}</h4>
                        <h5><i>{nowPlaying.item.album.name}</i></h5>
                        <div className="d-flex flex-row mt-2 mb-2">
                            <img src={nowPlaying.item.album.images[0].url} alt="album art" className={styles.album}/>   
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress">
                        <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="d-flex flex-row justify-content-between">
                        <h6 className="currentTime">{fancyTimeFormat(nowPlaying.progress_ms)}</h6>
                        <h6 className="maxTime">{fancyTimeFormat(nowPlaying.item.duration_ms)}</h6>
                    </div>
                </div>
                :
                <p>Nothing playing</p>
            }
        </div>
    );
}