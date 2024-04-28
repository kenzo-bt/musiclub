import { API_URL } from '../Globals.js'
import { useState, useEffect } from 'react';
import Record from './Record.js';
import './AlbumsTab.css';

function AlbumsTab({requestToken, userInfo}) {
  const [albums, setAlbums] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [otherUsersLiked, setOtherUsersLiked] = useState([]);
  const [userLikesFetched, setUserLikesFetched] = useState(false);
  let trackPlayCallback = undefined;

  useEffect(() => {
    async function fetchUserLikes() {
      const queryParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const response = await fetch(API_URL + 'liked', queryParameters);
      const data = await response.json();
      setOtherUsersLiked(data.likedTracks);
      const userLikes = data.likedTracks.filter(track => track.likedBy.includes(userInfo.id));
      setLikedTracks(userLikes.map(track => track.id));
      setUserLikesFetched(true);
    }

    async function fetchAlbums() {
      const queryParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const response = await fetch(API_URL + 'selectedAlbums', queryParameters);
      const data = await response.json();
      setAlbums(data.albums);
    }

    fetchAlbums();
    if (userInfo !== undefined && userInfo !== null) {
      fetchUserLikes();
    }
  }, [userInfo]);

  function isTrackLiked(trackId) {
    return likedTracks.includes(trackId);
  }

  function addLikedTrack(trackId) {
    const liked = [...likedTracks];
    liked.push(trackId);
    setLikedTracks(liked);
  }

  function removeLikedTrack(trackId) {
    const liked = [...likedTracks];
    const updatedLiked = liked.filter(x => x !== trackId);
    setLikedTracks(updatedLiked);
  }

  function playTrack(src, callback) {
    const player = document.getElementById("audioPlayer");
    if (player.src === src) {
      player.play();
    }
    else {
      if (trackPlayCallback !== undefined) {
        trackPlayCallback();
      }
      trackPlayCallback = callback;
      player.pause();
      player.src = src;
      player.play();
    }
  }

  function pauseTrack() {
    const player = document.getElementById("audioPlayer");
    player.pause();
  }

  function handleAudioEnd() {
    if (trackPlayCallback !== undefined) {
      trackPlayCallback();
    }
  }

  return (
    <div className="Tab container" id="albumsTab">
      <div className="tabContent centered">
        {albums.map((album, i) => {
          return (
            <Record
              key={album.id}
              name={album.name}
              artist={album.artist}
              year={album.year}
              cover={album.cover}
              albumID={album.albumID}
              tracks={album.tracks}
              ownerID={album.ownerID}
              userInfo={userInfo}
              requestToken={requestToken}
              isTrackLiked={isTrackLiked}
              addLike={addLikedTrack}
              removeLike={removeLikedTrack}
              playTrack={playTrack}
              pauseTrack={pauseTrack}
              otherLikes={otherUsersLiked}
              readyToOpen={userLikesFetched}
            />
          );
        })}
      </div>
      <audio preload="none" src="https://p.scdn.co/mp3-preview/b4c682084c3fd05538726d0a126b7e14b6e92c83?cid=9cb9b55a9f4f402a8a250030f7c35468" id="audioPlayer" onEnded={handleAudioEnd}></audio>
    </div>
  );
}

export default AlbumsTab;
