import { PLAYLIST_ID, getLocalToken } from '../Globals.js';
import { useState, useEffect } from 'react';
import PlaylistItem from './PlaylistItem.js';
import './PlaylistTab.css';

function PlaylistTab({requestToken}) {
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [playlistName, setPlaylistName] = useState("");

  useEffect(() => {
    async function getPlaylist() {
      var queryParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + getLocalToken()
        }
      }
      const response = await fetch('https://api.spotify.com/v1/playlists/' + PLAYLIST_ID , queryParameters);
      if (response.status === 200) {
        const data = await response.json();
        setPlaylistName(data.name);
        setPlaylistTracks(data.tracks.items);
      }
      else if (response.status === 401) {
        console.log("Access token has expired while trying to fetch playlist. Retrying...");
        const tokenRetrievalSuccess = await requestToken();
        if (tokenRetrievalSuccess) {
          getPlaylist();
        }
      }
      else {
        console.log("Error: Unable to retrieve playlist from spotify API");
      }
    }
    getPlaylist();
  }, [requestToken]);

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
