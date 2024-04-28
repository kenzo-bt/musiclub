import './UserTab.css';

function UserTab(props) {
  async function debugUserPlaylists() {
    const requestParameters = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + props.requestToken()
      }
    };

    const response = await fetch("https://api.spotify.com/v1/me/playlists", requestParameters);
    if (response.status === 200) {
      const data = await response.json();
    }
    else if (response.status === 401) {
      console.log("Access token has expired. Requesting new token...");
      const tokenRenewalSuccess = await props.onTokenExpiration();
      if (tokenRenewalSuccess) {
        debugUserPlaylists();
      }
    }
    else {
      console.log(response.statusText);
    }
  }

  return (
    <div className="Tab container" id="userTab">
      <div className="tabContent centered">
        <h2 className="userTitle">User profile</h2>
        <div className="separator"></div>
        <div className="userSubtitle">Username</div>
        <div className="userData">{props.userInfo.username}</div>
        <button onClick={debugUserPlaylists}>Change Username</button>
        <button onClick={debugUserPlaylists}>Change Password</button>
        <button onClick={debugUserPlaylists}>Debug Playlists</button>
      </div>
    </div>
  );
}

export default UserTab;
