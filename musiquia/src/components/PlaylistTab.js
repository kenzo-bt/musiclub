import { PLAYLIST_ID, CLIENT_ID, CLIENT_SECRET } from '../Globals.js';
import { useState, useEffect } from 'react';
import PlaylistItem from './PlaylistItem.js';
import './PlaylistTab.css';

function PlaylistTab(props) {
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [playlistName, setPlaylistName] = useState("");

  useEffect(() => {
    async function checkIfTokenAlive(token) {
      const queryParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      }
      const res = await fetch("https://api.spotify.com/v1/tracks/11dFghVXANMlKmJXsNCbNl", queryParameters);
      if (res.status === 200) {
        return true;
      }
      else {
        return false;
      }
    }

    async function updateAccessTokenInDatabase(token) {
      // Add album to database
      const postParameters = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: token
        })
      }
      const res = await fetch('https://www.myxos.online/musicAPI/auth/accessToken', postParameters);
      if (res.status === 200) {
        console.log("Successfully updated access token in database");
      }
      else {
        console.log("Error: Unable to update access token in database");
      }
    }

    async function handleExpiredToken() {
      // Get refresh token from server
      const params = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
      const res = await fetch("https://www.myxos.online/musicAPI/auth/tokens", params);
      if (res.status === 200) {
        const data = await res.json();
        const refToken = data.refreshToken;
        const accToken = data.accessToken;
        console.log("Access/Refresh tokens retrieved from server");
        const tokenAlive = await checkIfTokenAlive(accToken);
        if (tokenAlive) {
          // Update local access token with one in the database
          console.log("Successfully retrieved a valid access token from server");
          document.getElementById("spotifyToken").innerHTML = accToken;
          return true;
        }
        else {
          // Request a new access token from spotify API
          const authParameters = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
            },
            body: 'grant_type=refresh_token&refresh_token=' + refToken
          }
          const response = await fetch("https://accounts.spotify.com/api/token", authParameters);
          if (response.status === 200) {
            const data = await response.json();
            console.log("New access token received from Spotify API");
            console.log(data);
            updateAccessTokenInDatabase(data.access_token);
            document.getElementById("spotifyToken").innerHTML = data.access_token;
            return true;
          }
          else {
            console.log("Error: Couldn't get new access token from Spotify API - Status code: " + response.status);
            return false;
          }
        }
      }
      else {
        console.log("Unable to retrieve refresh token from server");
        return false;
      }
    }

    async function getPlaylist() {
      const accessToken = document.getElementById("spotifyToken").innerHTML;
      var queryParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        }
      }
      const response = await fetch('https://api.spotify.com/v1/playlists/' + PLAYLIST_ID , queryParameters);
      if (response.status === 200) {
        const data = await response.json();
        setPlaylistName(data.name);
        setPlaylistTracks(data.tracks.items);
      }
      else if (response.status === 401) {
        console.log("Access token has expired. Requesting new token...");
        const tokenRenewalSuccess = await handleExpiredToken();
        if (tokenRenewalSuccess) {
          getPlaylist();
        }
        else {
          console.log("Unable to get a new access token from Spotify API");
        }
      }
      else {
        console.log("Unable to retrieve playlist from spotify API");
      }
    }
    getPlaylist();
  }, []);

  return (
    <div className="Tab container" id="playlistTab">
      <div className="tabContent centered">
        <h2>{playlistName}</h2>
        <div className="playlistTracks">
        {
          playlistTracks.map((item, i) => {
            return (
              <PlaylistItem
                trackName={item.track.name}
                trackId={item.track.id}
                preview={item.track.preview_url}
                albumImg={item.track.album.images[2].url}
              />
            );
          })
        }
        </div>
      </div>
    </div>
  );
}

export default PlaylistTab;
