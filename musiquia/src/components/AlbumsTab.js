import { useState, useEffect } from 'react';
import Record from './Record.js';
import './AlbumsTab.css';

function AlbumsTab(props) {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    const queryParameters = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    fetch('https://myxos.online/musicAPI/selectedAlbums', queryParameters)
      .then(response => response.json())
      .then(data => {
        console.log("Fetched from api");
        setAlbums(data.albums);
      });
  }, []);

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
              userInfo={props.userInfo}
              requestToken={props.requestToken}
              onTokenExpiration={props.onTokenExpiration}
            />
          );
        })}
      </div>
    </div>
  );
}

export default AlbumsTab;
