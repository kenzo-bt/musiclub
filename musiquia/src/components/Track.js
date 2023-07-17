import { useState } from 'react';
import { PLAYLIST_ID } from '../Globals.js';
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
    const response = await fetch("https://www.myxos.online/musicAPI/users/" + props.userInfo.id + "/addTrack/" + props.id, requestParameters);
    if (response.status === 200) {
      console.log("Added track to liked...");
      return true;
    }
    else if (response.status === 250) { // Add to playlist
      const playlistEditSuccess = await addTrackToPlaylist();
      return playlistEditSuccess ? true : false;
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
    const response = await fetch("https://www.myxos.online/musicAPI/users/" + props.userInfo.id + "/removeTrack/" + props.id, requestParameters);
    if (response.status === 200) {
      console.log("Removed track from liked...");
      return true;
    }
    else if (response.status === 251) { // Remove from playlist
      const playlistEditSuccess = await removeTrackFromPlaylist();
      return playlistEditSuccess ? true : false;
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

  async function checkTrackDuplication() {
    // Get playlist from spotify https://api.spotify.com/v1/playlists/{playlist_id}
    var queryParameters = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + props.requestToken()
      }
    }
    const response = await fetch('https://api.spotify.com/v1/playlists/' + PLAYLIST_ID, queryParameters);
    if (response.status === 200) {
      const data = await response.json();
      for (const item of data.tracks.items) {
        if (item.track.id === props.id) {
          console.log("Track was already in playlist");
          return true;
        }
      }
      return false;
    }
    else if (response.status === 401) {
      console.log("Access token has expired. Requesting new token...");
      const tokenRenewalSuccess = await props.onTokenExpiration();
      if (tokenRenewalSuccess) {
        console.log("Token available to Track.js : " + props.requestToken());
        return checkTrackDuplication();
      }
      else {
        console.log("Unable to get a new access token from Spotify API");
        return true;
      }
    }
    else {
      console.log("Couldnt fetch playlist from spotify API");
      return true;
    }
  }

  async function addTrackToPlaylist() {
    const trackInPlaylist = await checkTrackDuplication();
    if (!trackInPlaylist) {
      const requestParameters = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + props.requestToken()
        },
        body: JSON.stringify({
          uris: ['spotify:track:' + props.id],
          position: 0
        })
      }
      const response = await fetch("https://api.spotify.com/v1/playlists/" + PLAYLIST_ID + "/tracks", requestParameters);
      if (response.status === 201) {
        console.log("Added track successfully to playlist");
        return true;
      }
      else if (response.status === 401) {
        console.log("Access token has expired. Requesting new token...");
        const tokenRenewalSuccess = await props.onTokenExpiration();
        if (tokenRenewalSuccess) {
          console.log("Token available to Track.js : " + props.requestToken());
          return await addTrackToPlaylist();
        }
        else {
          console.log("Could not renew token...");
          return false;
        }
      }
      else {
        return false;
      }
    }
  }

  async function removeTrackFromPlaylist() {
    const requestParameters = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + props.requestToken()
      },
      body: JSON.stringify({
        tracks: [
          { uri: 'spotify:track:' + props.id }
        ]
      })
    }
    const response = await fetch("https://api.spotify.com/v1/playlists/" + PLAYLIST_ID + "/tracks", requestParameters);
    if (response.status === 200) {
      console.log("Track successfully removed from playlist");
      return true;
    }
    else if (response.status === 401) {
      console.log("Access token has expired. Requesting new token...");
      const tokenRenewalSuccess = await props.onTokenExpiration();
      if (tokenRenewalSuccess) {
        console.log("Token available to Track.js : " + props.requestToken());
        return await removeTrackFromPlaylist();
      }
      else {
        console.log("Could not renew token...");
        return false;
      }
    }
    else {
      return false;
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
