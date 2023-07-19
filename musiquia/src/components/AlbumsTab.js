import { useState, useEffect } from 'react';
import Record from './Record.js';
import './AlbumsTab.css';

function AlbumsTab({requestToken, userInfo}) {
  const [albums, setAlbums] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);

  useEffect(() => {
    async function fetchUserLikes() {
      const username = userInfo.username;
      const queryParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const response = await fetch('https://myxos.online/musicAPI/users/' + username, queryParameters);
      if (response.status === 200) {
        const data = await response.json();
        setLikedTracks(data.likedTracks);
      }
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
            />
          );
        })}
      </div>
    </div>
  );
}

export default AlbumsTab;
