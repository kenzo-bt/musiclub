import { useState } from 'react';
import Record from './Record.js';
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
      console.log("Initiate search with query: '"+ searchQuery +"'");
      console.log("Access Token: " + props.requestToken());

      // Query headers for HTTP request to be sent to Spotify API
      var queryParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + props.requestToken()
        }
      }

      // Send HTTP request and store response
      const response = await fetch('https://api.spotify.com/v1/search?q=' + searchQuery + '&type=album&limit=20', queryParameters);
      if (response.status === 200) {
        const data = await response.json();
        setAlbums(data.albums.items);
      }
      else if (response.status === 401) {
        console.log("Access token has expired. Requesting new token...");
        const tokenRenewalSuccess = await props.onTokenExpiration();
        if (tokenRenewalSuccess) {
          console.log("Token has been renewed");
          console.log("Local access token: " + props.requestToken());
          initiateSearch();
        }
      }
      else {
        console.log(response.statusText);
      }
    }
  }

  console.log(albums);

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
              onTokenExpiration={props.onTokenExpiration}
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
