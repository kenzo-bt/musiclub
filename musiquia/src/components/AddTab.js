import { useState } from 'react';
import Record from './Record.js';
import { getLocalToken } from '../Globals.js';
import './AddTab.css';

function AddTab(props){
  const [albums, setAlbums] = useState([]);

  function handleInputEnter (event) {
    if (event.key === "Enter")
    {
      initiateSearch();
    }
  }

  async function initiateSearch() {
    const searchQuery = document.getElementById("searchBarInput").value;

    if (searchQuery !== "" && searchQuery !== undefined)
    {
      // Query headers for HTTP request to be sent to Spotify API
      var queryParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + getLocalToken()
        }
      }
      // Send HTTP request and store response
      const response = await fetch('https://api.spotify.com/v1/search?q=' + searchQuery + '&type=album&limit=20', queryParameters);
      if (response.status === 200) {
        const data = await response.json();
        setAlbums(data.albums.items);
      }
      else if (response.status === 401) {
        console.log("Access token expired while trying to search albums. Retrying...");
        const tokenRetrievalSuccess = await props.requestToken();
        if (tokenRetrievalSuccess) {
          initiateSearch();
        }
      }
      else {
        console.log(response.statusText);
      }
    }
  }

  return (
    <div className="Tab container" id="addTab">
      <div className="tabContent centered">
        <div className="searchBar">
          <input id="searchBarInput" className="searchInput" type="text" placeholder="Search for an album ..." onKeyDown={handleInputEnter} />
          <button type="button" onClick={initiateSearch}>
            <img src="search.png" alt="search icon" />
          </button>
        </div>
        {albums.map((album, i) => {
          return (
            <Record
              key={album.id}
              name={album.name}
              artist={album.artists[0].name}
              year={album.release_date}
              cover={album.images[0].url}
              albumID={album.id}
              requestToken={props.requestToken}
              userInfo={props.userInfo}
              viewMode="Search"
            />
          );
        })}
      </div>
    </div>
  );
}

export default AddTab;
