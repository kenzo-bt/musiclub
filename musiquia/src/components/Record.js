import { useState } from 'react';
import './Record.css';
import Track from './Track.js';
import { showAlert, getLocalToken, API_URL } from '../Globals.js';

function Record(props) {
  const [tracksVisible, setTracksVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  let containerClass = "Record";
  let imageClass = "recordImage";
  let infoClass = "recordInfo";


  if (props.viewMode === "Search")
  {
    containerClass += "Search";
    imageClass += "Search";
    infoClass += "Search";
  }

  async function toggleTracks(event) {
    if (tracksVisible) {
      setTracksVisible(false);
    }
    else {
      setTracksVisible(true);
    }
  }

  async function fetchTracklist() {
    const queryParameters = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getLocalToken()
      }
    }
    const response = await fetch("https://api.spotify.com/v1/albums/" + props.albumID + "/tracks", queryParameters);
    if (response.status === 200) {
      const data = await response.json();
      const tracks = data.items.map(track => ({"name": track.name, "id": track.id, "preview": track.preview_url}));
      return tracks;
    }
    else if (response.status === 401) {
      console.log("Access token expired while trying to retrieve tracklist. Retrying...");
      const tokenRetrievalSuccess = await props.requestToken();
      if (tokenRetrievalSuccess) {
        return fetchTracklist();
      }
    }
    else {
      console.log("Error: Couldnt fetch album tracks from spotify API");
      return false;
    }
  }

  async function addAlbum(event) {
    const albumID = props.albumID;
    if (albumID !== "" && albumID !== undefined) {
      // Activate loading indicator
      showLoadingIndicator(event.target);
      // Fetch the album from spotify API to get tracklist information
      const retrievedTracks = await fetchTracklist();
      if (retrievedTracks) {
        // Add album to database
        const requestParameters = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            albumID: props.albumID,
            name: props.name,
            artist: props.artist,
            year: props.year.substring(0, 4),
            cover: props.cover,
            ownerID: props.userInfo.id,
            tracks: retrievedTracks
          })
        }
        await fetch(API_URL + 'selectedAlbums', requestParameters)
          .then(response => response.json())
          .then(data => {
            if(data.error !== undefined) {
              console.log("Error: " + data.error);
              showAlert("Error", "Album already exists in listening queue");
            }
            else {
              showSuccessIndicator(event.target);
            }
            hideLoadingIndicator(event.target);
          });
      }
      else {
        showAlert("Error", "Unable to retrieve album information from Spotify");
        hideLoadingIndicator(event.target);
      }
    }
  }

  function showLoadingIndicator(element) {
    while (!element.className.includes("RecordSearch")) {
      element = element.parentElement;
      if (element.tagName === "BODY") {
        break;
      }
    }
    if (element.className.includes("RecordSearch")) {
      element.children[2].style.display = "flex";
    }
  }

  function hideLoadingIndicator(element) {
    while (!element.className.includes("RecordSearch")) {
      element = element.parentElement;
      if (element.tagName === "BODY") {
        break;
      }
    }
    if (element.className.includes("RecordSearch")) {
      element.children[2].style.display = "none";
    }
  }

  function showSuccessIndicator(element) {
    while (!element.className.includes("RecordSearch")) {
      element = element.parentElement;
      if (element.tagName === "BODY") {
        break;
      }
    }
    if (element.className.includes("RecordSearch")) {
      element.children[3].style.display = "flex";
      element.children[3].style.opacity = 1;
      setTimeout(() => {
        element.children[3].style.opacity = 0;
      }, 1300);
      setTimeout(() => {
        element.children[3].style.display = "none";
      }, 1600);
    }
  }

  async function handleDeleteAlbum(event) {
    event.stopPropagation();
    const params = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    }
    const res = await fetch(API_URL + "selectedAlbums/" + props.albumID, params);
    if (res.status === 200) {
      setHidden(true);
    }
    else {
      showAlert("Error", "Unable to remove album from listening queue");
    }
  }

  return (
    <div className={containerClass + " " + (hidden ? "hidden" : "")} onClick={props.viewMode === "Search" ? addAlbum : toggleTracks}>
      <div className={imageClass}>
        <img className="recordCover" src={props.cover} alt="cover" />
      </div>
      <div className={infoClass}>
        <h2 className="recordName">{props.name}</h2>
        <h3 className="recordArtist">{props.artist}</h3>
        <h4 className="recordYear">{props.year.substring(0, 4)}</h4>
      </div>
      {
        tracksVisible ?
        <div className="recordTracks">
          {
            props.tracks !== undefined ?
              props.tracks.map(track => {
                const isLiked = props.isTrackLiked(track.id);
                return (
                  <Track
                    name={track.name}
                    id={track.id}
                    preview={track.preview}
                    liked={isLiked}
                    userInfo={props.userInfo}
                    requestToken={props.requestToken}
                    addLike={props.addLike}
                    removeLike={props.removeLike}
                    playTrack={props.playTrack}
                    pauseTrack={props.pauseTrack}
                  />
                );
              })
              :
              ""
          }
        </div>
        :
        ""
      }
      {
        props.userInfo !== undefined && props.ownerID === props.userInfo.id ?
          <div className="deleteAlbum">
            <button className="deleteAlbumButton" onClick={handleDeleteAlbum}>
              <img className="deleteAlbumImage" src={require("../Images/trash.png")} alt="delete icon" />
            </button>
          </div>
        :
          ""
      }
      <div className="loadingArea">
        <div className="lds-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
      <div className="successIndicator">
        <img src="check.png" alt="success icon" />
      </div>
    </div>
  );
}

export default Record;
