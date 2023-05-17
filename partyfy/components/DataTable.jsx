import { useContext, useEffect, useState } from 'react';
import UserContext from '../pages/providers/UserContext';
import styles from '../styles/Dashboard.module.css';
import e from '../pages/assets/e.png';
import ClearTable from './ClearTable';

export default function DataTable({ title }) {
    const {
        spotifyAuth,
        user
    } = useContext(UserContext);

    const [recents, setRecents] = useState([]);
    const [queue, setQueue] = useState([]);

    if (user) {
        useEffect(() => {
            async function getRecents() {
                let response = await fetch('/api/database/recents?UserID=' + user.sub ?? user.user_id); 
                let data = await response.json();
                let songs = data.recordset;
                if (!songs) return;
                if (songs.length === 0) return;
                setRecents(songs);
            }
            
            async function getQueue() {
                let response = await fetch("/api/spotify/queue?UserID=&access_token=" + spotifyAuth.accessToken); 
                let data = await response.json();
                console.log(data);
                if (!data) return;
                if (data.queue.length === 0) return;
                setQueue(data.queue);
            }

            if (title === "Recently Played") {
                var interval = setInterval(getRecents, 3000);
            }
            else if (title === "Queue") {
                var interval = setInterval(getQueue, 3000);
            }

            if (interval) {
                return () => clearInterval(interval);
            }
        })
    }

    // Format date object to HH:MM with am/pm
    function formatTime(date) {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        let strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }

    const removeHeaders = ['OwnerUserID', 'Explicit', 'ID', 'Art'];

    return (
    <div className={styles.datatable}>
        <div className="d-flex justify-content-center align-items-center">
            <h3 className={"text-center"}>{title === "Queue" ? "Up Next" : title}</h3> 
        </div>
        <table className='table table-dark' style={{ display: 'block', height: '80vh' }}>
            <thead>
                <tr style={{ width: '40vw'}}>
                    { 
                        title === "Recently Played" && recents && recents.length > 0 && Object.keys(recents[0]).map((key, index) => {
                            if (key.includes("Song")) key = key.replace("Song", "");
                            if (key === 'PlayedAt') key = 'Played At';
                            if (removeHeaders.includes(key)) return;
                            return <th scope='col' key={index}>{key}</th>
                        })
                    }
                    {
                        title === "Queue" &&
                        <>
                            <th scope='col'>Name</th>
                            <th scope='col'>Artist</th>
                            <th scope='col'>Added At</th>
                        </>
                    }
                </tr>
            </thead>
            <tbody style={{ height: '80vh' }}>
                {
                    title === "Recently Played" && recents && recents.length > 0 && recents.map((song, index) => {
                        let playedAt = new Date(song.PlayedAt);
                        return (
                            <tr key={index}>
                                <td>
                                    <div className="d-flex" style={{ width: 'auto' }}>
                                        <img src={song.SongArt} style={{ width: '3vh', height: '3vh', marginRight: '1vh' }}/>
                                        <h5>{song.SongName}</h5>
                                        {
                                            song.SongExplicit && 
                                            <img className={`${styles.eicon} ms-2 mt-1`} src={e.src} style={{ width: '1.5vh', height: '1.5vh' }}/>
                                        }
                                    </div>
                                </td>
                                <td><h5>{song.SongArtist}</h5></td>
                                <td><h5>{song.SongAlbum}</h5></td>
                                <td><h5>{formatTime(playedAt)}</h5></td>
                            </tr>
                        )
                    })
                }
                {
                    title === "Queue" && queue && queue.length > 0 && queue.map((song, index) => {
                        return (
                            <tr key={index}>
                                <td>
                                    <div className="d-flex" style={{ width: 'auto' }}>
                                        <img src={song.album.images[2].url} style={{ width: '3vh', height: '3vh', marginRight: '1vh' }}/>
                                        <h5>{song.name}</h5>
                                        {
                                            song.explicit && 
                                            <img className={`${styles.eicon} ms-2 mt-1`} src={e.src} style={{ width: '1.5vh', height: '1.5vh' }}/>
                                        }
                                    </div>
                                </td>
                                <td><h5>{song.artists.map(artist => artist.name).join(", ")}</h5></td>
                                <td><h5>{song.album.name}</h5></td>
                            </tr>
                        )
                    })
                }
            </tbody>
        </table>
    </div>
    );
}