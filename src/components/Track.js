import { useState } from 'react';
import { API_URL } from '../Globals.js';
import './Track.css';

function Track(props) {
  const [playing, setPlaying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isLiked, setIsLiked] = useState(props.liked);

  const names = [];
  if (props.otherLikes[0] !== undefined){
    props.otherLikes[0].likedBy.forEach(user => {
      if (user === 2 && props.userInfo.username !== "kenzo") {names.push("Kenzo")};
      if (user === 6 && props.userInfo.username !== "nicolas") {names.push("Nicolas")};
      if (user === 7 && props.userInfo.username !== "esteban") {names.push("Esteban")};
      if (user === 8 && props.userInfo.username !== "fernando") {names.push("Fernando")};
    });
  }

  async function addTrackToLiked() {
    const requestParameters = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const response = await fetch(API_URL + "users/" + props.userInfo.id + "/addTrackFull/" + props.id, requestParameters);
    if (response.status === 200) {
      props.addLike(props.id);
      return true;
    }
    else {
      const data = await response.json();
      console.log(data["Error"]);
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
      props.removeLike(props.id);
      return true;
    }
    else {
      const data = await response.json();
      console.log(data["Error"]);
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
    if (!processing) {
      toggleFavourite();
    }
  }

  function resetPlayButton() {
    setPlaying(false);
  }

  function togglePlay(event) {
    event.stopPropagation();
    if (playing) {
      props.pauseTrack();
      setPlaying(false);
    }
    else {
      props.playTrack(props.preview, resetPlayButton);
      setPlaying(true);
    }
  }

  return (
    <div className="Track">
      <div className="trackName">{props.name}</div>
      <div className="trackButtons">
        {
          props.preview !== "" && props.preview !== undefined && props.preview !== null ?
            <img
              className="playButton"
              src={require("../images/" + (playing ? "pause" : "play") + ".png")}
              alt={(playing ? "pause" : "play") + " icon"}
              onClick={togglePlay}
            />
          :
            ""
        }
        <img
          className={"likeButton" + (processing ? " processing" : "")}
          src={require("../images/star" + (isLiked ? "Select" : "") + ".png")}
          alt={isLiked ? "liked" : "unlike"}
          onClick={favouriteTrack}
        />
        <div className="otherLikes">
          <img
            className="otherLikesStars"
            src={require("../images/stars-" + names.length + ".png")}
            alt={names.length + " stars symbol"}
            title={names.join(", ")}
          />
        </div>
      </div>
    </div>
  );
}

export default Track;
