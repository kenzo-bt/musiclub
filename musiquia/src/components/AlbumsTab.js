import { useState, useEffect } from 'react';
import Record from './Record.js';
import './AlbumsTab.css';

function AlbumsTab({requestToken, userInfo, setUserTurn}) {
  const [albums, setAlbums] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [otherUsersLiked, setOtherUsersLiked] = useState([]);
  let trackPlayCallback = undefined;

  useEffect(() => {
    async function fetchUserLikes() {
      const queryParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const response = await fetch('https://myxos.online/musicAPI/liked', queryParameters);
      const data = await response.json();
      setOtherUsersLiked(data.likedTracks);
      const userLikes = data.likedTracks.filter(track => track.likedBy.includes(userInfo.id));
      setLikedTracks(userLikes.map(track => track.id));
    }

    async function fetchAlbums() {
      const queryParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const response = await fetch('https://myxos.online/musicAPI/selectedAlbums', queryParameters);
      const data = await response.json();
      setAlbums(data.albums);

      // Count how many albums each user has posted
      let kenzoCount = 0;
      let nicolasCount = 0;
      let estebanCount = 0;
      data.albums.forEach(album => {
          if (album.ownerID === 2){kenzoCount++};
          if (album.ownerID === 6){nicolasCount++};
          if (album.ownerID === 7){estebanCount++};
      })

      //return the index of the album object when it finds it by OwnderID
      function findLastPost(id){
        const indexArray = [...data.albums];
        const index = indexArray.reverse().findIndex(obj => obj.ownerID === id);
        return index + 1;
      }

      const albumArray = [
        {
          "name": "kenzo",
          "ownerID": 2,
          "albumCount": kenzoCount,
          "lastAddedIndex": findLastPost(2)
        },
        {
          "name": "nicolas",
          "ownerID": 6,
          "albumCount": nicolasCount,
          "lastAddedIndex": findLastPost(6)
        },
        {
          "name": "esteban",
          "ownerID": 7,
          "albumCount": estebanCount,
          "lastAddedIndex": findLastPost(7)
        },
      ]  

      //Sort the array of objects by descending order in Album Count and ascending order in turn
      albumArray.sort((a, b) => {
        if (a.albumCount === b.albumCount) {
          return b.lastAddedIndex - a.lastAddedIndex;
        }
        return a.albumCount - b.albumCount;
      });
      
      // Take the first two objects from the sorted array and map them into an array
      const firstTwoObjects = albumArray.slice(0, 2);
      const turnNames = firstTwoObjects.map(obj => obj.name);
      setUserTurn(turnNames);
    }

    fetchAlbums();
    if (userInfo !== undefined && userInfo !== null) {
      fetchUserLikes();
    }
  }, [userInfo, setUserTurn]);

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
            />
          );
        })}
      </div>
      <audio preload="none" src="https://p.scdn.co/mp3-preview/b4c682084c3fd05538726d0a126b7e14b6e92c83?cid=9cb9b55a9f4f402a8a250030f7c35468" id="audioPlayer" onEnded={handleAudioEnd}></audio>
    </div>
  );
}

export default AlbumsTab;
