import { useEffect, useState } from 'react';
import e from './assets/e.png';

export default function Spotify() {
  const [latest, setLatest] = useState({});
  const [progress, setProgress] = useState({});

  useEffect(() => {
    let interval = setInterval(() => {
      fetch(`http://localhost:8080/latest`)
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
        <div className="songinfo">
          {
            latest.explicit 
            ?           
            <div className="center">
              <h3><strong>{latest.name}</strong></h3>
              <img className="e-icon" src={e}></img>
            </div>
            :
            <h3><strong>{latest.name}</strong></h3>
          }
          <h3>{latest.artist}</h3>
          <h3><i>{latest.album_name}</i></h3>
        </div>
        <div className="progress">
          <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" width="75%"></div>
        </div>
        <div className="time">
          <p className="currentTime">{progress.currentTime}</p>
          <p className="maxTime">{progress.maxTime}</p>
        </div>
        <img id="albumart" src={latest.album} alt="album" />
      </div>
    );
  }
  
  return (
    <div className="now-playing">
      <h1>Nothing is playing!</h1>
    </div>
  )
}

