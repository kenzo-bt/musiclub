import { useState } from 'react';
import { API_URL } from '../Globals.js';
import './Track.css';

function Track(props) {
  const [playing, setPlaying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isLiked, setIsLiked] = useState(props.liked);

  async function addTrackToLiked() {
    const requestParameters = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const response = await fetch(API_URL + "users/" + props.userInfo.id + "/addTrackFull/" + props.id, requestParameters);
    if (response.status === 200) {
      console.log("Added track to liked...");
      props.addLike(props.id);
      return true;
    }
    else {
      return false;
    }
  }

  async function removeTrackFromLiked() {
    const requestParameters = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const response = await fetch(API_URL + "users/" + props.userInfo.id + "/removeTrackFull/" + props.id, requestParameters);
    if (response.status === 200) {
      console.log("Removed track from liked...");
      props.removeLike(props.id);
      return true;
    }
    else {
      return false;
    }
  }

  async function toggleFavourite() {
    setIsLiked(!isLiked);
    setProcessing(true);
    if (isLiked) {
      // Remove from liked tracks in server
      const removeSuccess = await removeTrackFromLiked();
      if (!removeSuccess) {
        // if failed to remove, reset icon
        setIsLiked(true);
        console.log("Error: Unable to remove track from user's likedTracks");
      }
    }
    else {
      // Add to liked tracks in server
      const addSuccess = await addTrackToLiked();
      if (!addSuccess) {
        setIsLiked(false);
        console.log("Error: Unable to add track to user's likedTracks");
      }
    }
    setProcessing(false);
  }

  function favouriteTrack(event) {
    event.stopPropagation();
    console.log("Clicked on track " + props.name + " - ID: " + props.id);
    if (!processing) {
      toggleFavourite();
    }
  }

  function togglePlay(event) {
    event.stopPropagation();
    let audioElement = document.getElementById("player-" + props.id);
    console.log(audioElement);
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
    <div className="Track">
      <div className="trackName">{props.name}</div>
      <div className="trackButtons">
        {
          props.preview !== "" && props.preview !== undefined && props.preview !== null ?
            <audio preload="none" src={props.preview} id={"player-" + props.id}></audio>
          :
            ""
        }
        {
          props.preview !== "" && props.preview !== undefined && props.preview !== null ?
            <img className="playButton" src={"" + (playing ? "pause" : "play") + ".png"} alt="player icon" onClick={togglePlay} />
          :
            ""
        }
        <img className={"likeButton" + (processing ? " processing" : "")} src={"star" + (isLiked ? "Select" : "") + ".png"} alt={isLiked ? "liked" : "unlike"} onClick={favouriteTrack} />
      </div>
    </div>
  );
}

export default Track;
