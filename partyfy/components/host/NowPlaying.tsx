import { fancyTimeFormat } from '@/helpers/Utils';
import e from '@/pages/assets/e.png';
import UserContext from '@/providers/UserContext';
import { useContext, useEffect, useState } from 'react';

const timer = 1000;

const NowPlaying = ({ setIsAHost } : { setIsAHost: Function }) => {
    let nowPlayingType = false as any;
    const [nowPlaying, setNowPlaying] = useState(nowPlayingType);

    const { user } = useContext(UserContext);

    useEffect(() => {
        async function fn() {
            // Get current song, update now playing state
            let res = await fetch('/api/spotify/nowplaying?access_token=' + user.spotifyAuth.getAccessToken());
            if (res.status === 204) {
                setNowPlaying(false);
                return;
            }
            let currentSong = await res.json();

            // Get recent songs from database
            res = await fetch('/api/database/recents?UserID=' + user.getUserID());
            let data = (await res.json());
            if (data) {
                // Get first song in recent songs, see if it matches current song. If not, add to database
                const firstSong = data[0];
                if (!currentSong || !currentSong.item) {
                    await user.spotifyAuth.refreshAccessToken();
                    return;
                }
                if (!firstSong || firstSong.SongID !== currentSong.item.id) {
                    await fetch('/api/database/recents', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            SongID: currentSong.item.id,
                            UserID: user.getUserID(),
                            SongName: currentSong.item.name,
                            SongArtist: currentSong.item.artists.map((artist : any) => { return artist.name }).join(', '),
                            SongAlbum: currentSong.item.album.name,
                            SongExplicit: currentSong.item.explicit === 1,
                            SongArt: currentSong.item.album.images[0].url,
                        })
                    });
                }
            } else {
                await fetch('/api/database/recents', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        SongID: currentSong.item.id,
                        UserID: user.getUserID(),
                        SongName: currentSong.item.name,
                        SongArtist: currentSong.item.artists.map((artist : any) => { return artist.name }).join(', '),
                        SongAlbum: currentSong.item.album.name,
                        SongExplicit: currentSong.item.explicit === 1,
                        SongArt: currentSong.item.album.images[0].url,
                    })
                });
            }
            setNowPlaying(currentSong);
        }
        const interval = setInterval(fn, timer); 
        return () => clearInterval(interval);
    }, []);
    // Show progress bar as a value between 0 and 100
    let progress = null, songname : any = null;
    if (nowPlaying) {
        progress = nowPlaying.progress_ms ? nowPlaying.progress_ms / nowPlaying.item.duration_ms * 100 : null;
    
        // Song titles do not need to include featuring artists as they are usually provided in the artist field anyway
        songname = nowPlaying.item.name;
        const replacements = ['(feat.', '(with', '(Featuring']
        replacements.forEach((r) => {
            if (songname.includes(r)) {
                songname = songname.split(r)[0];
                return;
            }
        });
    }

    return (
        <div>
            <h3 className="text-center">Now Playing</h3>
            {
                nowPlaying
                ?
                <div>
                    {/* Song Information */}
                    <div>
                        {
                            nowPlaying.item.explicit 
                            ?           
                            <div className="d-inline-flex flex-center">
                                <h3><strong>{songname}</strong></h3>
                                <img className={`ms-3 mt-2`} src={e.src} alt="explicit"></img>
                            </div>
                            :
                            <h3><strong>{songname}</strong></h3>
                        }
                        <h4>{nowPlaying.item.artists.map((artist : any) => { return artist.name }).join(', ')}</h4>
                        <h5><i>{nowPlaying.item.album.name}</i></h5>
                        <div className="d-flex flex-row mt-2 mb-2">
                            <img src={nowPlaying.item.album.images[0].url} alt="album art"/>   
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress">
                        <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="d-flex flex-row justify-content-between">
                        <h6 className="currentTime">{fancyTimeFormat(nowPlaying.progress_ms)}</h6>
                        <h6 className="maxTime">{fancyTimeFormat(nowPlaying.item.duration_ms)}</h6>
                    </div>
                </div>
                :
                <h3 className="text-center">Nothing Playing</h3>
            }
        </div>
    );
}

export default NowPlaying;