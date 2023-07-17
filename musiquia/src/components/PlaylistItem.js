import './PlaylistItem.css';
import { useState } from 'react';

function PlaylistItem(props) {
  const [playing, setPlaying] = useState(false);

  function togglePlay(event) {
    event.stopPropagation();
    let audioElement = document.getElementById("player-" + props.trackId);
    if (playing) {
      audioElement.pause();
      setPlaying(false);
    }
    else {
      audioElement.play();
      setPlaying(true);
    }
  }

  return (
    <div className="PlaylistItem">
      <img className="playlistTrackImage" src={props.albumImg} alt="album" />
      <div className="playlistTrackName">{props.trackName}</div>
      {
         props.preview !== undefined && props.preview !== null && props.preview !== "" ?
          <img className="playButton" src={"" + (playing ? "pause" : "play") + ".png"} alt="player icon" onClick={togglePlay} />
         :
          ""
      }
      {
         props.preview !== undefined && props.preview !== null && props.preview !== "" ?
          <audio preload="none" src={props.preview} id={"player-" + props.trackId}></audio>
         :
          ""
      }
    </div>
  );
}

export default PlaylistItem;
