import { useEffect, useState } from 'react';
import { SECRETS } from './assets/secrets';
import e from './assets/e.png';

export default function Spotify() {
  const [latest, setLatest] = useState({});
  const [progress, setProgress] = useState({});
  const [queue, setQueue] = useState({});

  // Constantly updates the latest song
  useEffect(() => {
    let interval = setInterval(() => {
      fetch(`${SECRETS.apiAddress}/latest`)
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setLatest(data);
          setProgress({
            width: `${(data.progress_ms / data.duration_ms) * 100}%`,
            currentTime: `${fancyTimeFormat(data.progress_ms/1000)}`,
            maxTime: `${fancyTimeFormat(data.duration_ms/1000)}`,
          })
          document.querySelector('.progress-bar').style.width = `${(data.progress_ms / data.duration_ms) * 100}%`;
        });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Constantly updates the queue
  useEffect(() => {
    let interval = setInterval(() => {
      fetch(`${SECRETS.apiAddress}/latestqueue`)
        .then((response) => response.json())
        .then((data) => {
          if (!data.message) {
            console.log('New queue:', data);
            // Show queue popup
            setQueue(data);
            setTimeout(() => {
              setQueue({});
            }, 10000);
          }
        });
    }, 1000);
    return () => {
      clearInterval(interval);
    }
  }, []);

  // Formats song time labels from ms to mm:ss
  function fancyTimeFormat(duration){   
    // Hours, minutes and seconds
    var hrs = ~~(duration / 3600);
    var mins = ~~((duration % 3600) / 60);
    var secs = ~~duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
  } 

  if (latest.name) {
    return (
      <div className="now-playing">

        {/* Song Text Information */}
        <div className="songinfo">
          {
            latest.explicit 
            ?           
            <div className="center">
              <h3><strong>{latest.name}</strong></h3>
              <img className="e-icon" src={e} alt="explicit"></img>
            </div>
            :
            <h3><strong>{latest.name}</strong></h3>
          }
          <h3>{latest.artist}</h3>
          <h3><i>{latest.album_name}</i></h3>
        </div>

        {/* Progress Bar */}
        <div className="progress">
          <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" width="75%"></div>
        </div>
        <div className="time">
          <p className="currentTime">{progress.currentTime}</p>
          <p className="maxTime">{progress.maxTime}</p>
        </div>

        {/* Album Art */}
        <img id="albumart" src={latest.album} alt="album" />

        {/* Queue Popup */}
        {
          Object.keys(queue).length > 0
          ? 
          <div className="popup">
            <div>
              <div class="flex">
                <img className="account-image"  src={decodeURIComponent(queue.accountimage)} alt="account" />
                <h3 className="popup-header"><strong>{decodeURIComponent(queue.fullname)} Added to the Queue!</strong></h3>
              </div>
              <div class="flex">
                <div>
                  <h3>{decodeURIComponent(queue.songname)} {queue.explicit ? <img className="e-icon" src={e} alt="explicit"></img> : null}</h3>
                  <h3><i>{decodeURIComponent(queue.songartist)}</i></h3>
                </div>
                <img className="popup-image" src={decodeURIComponent(queue.songimg)} alt="album" />
              </div>
            </div>
          </div>
          : 
          null}
      </div>
    );
  }
  
  return (
    <div className="now-playing">
      <h1>Nothing is playing!</h1>
    </div>
  )
}

