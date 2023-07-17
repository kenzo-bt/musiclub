import './App.css';
import AddTab from './components/AddTab.js';
import AlbumsTab from './components/AlbumsTab.js';
import PlaylistTab from './components/PlaylistTab.js';
import Menu from './components/Menu.js';
import { useEffect, useState } from 'react';
import { CLIENT_ID, CLIENT_SECRET } from './Globals.js';

function App() {
  // const [accessToken, setAccessToken] = useState("");
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [user, setUser] = useState(undefined);

  // useEffect will run only once when application loads
  useEffect(() => {
    const getTokenFromServer = async () => {
      async function getAccessToken() {
        const params = {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
        const res = await fetch("https://www.myxos.online/musicAPI/auth/tokens", params);
        if (res.status === 200) {
          const data = await res.json();
          return data.accessToken;
        }
        else {
          return -1;
        }
      }

      async function updateAccessToken(token) {
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

      async function getRefreshToken() {
        const params = {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
        const res = await fetch("https://www.myxos.online/musicAPI/auth/tokens", params);
        if (res.status === 200) {
          const data = await res.json();
          return data.refreshToken;
        }
        else {
          return -1;
        }
      }

      async function checkIfAlive(token) {
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

      async function getNewToken(refreshToken) {
        const authParameters = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
          },
          body: 'grant_type=refresh_token&refresh_token=' + refreshToken
        }
        const res = await fetch("https://accounts.spotify.com/api/token", authParameters);
        if (res.status === 200) {
          const data = await res.json();
          console.log(data);
          return data.access_token;
        }
        else {
          return -1;
        }
      }

      // Get access token from server
      console.log("Getting access token from server...");
      const accToken = await getAccessToken();
      // Sanity check to see if token still alive
      console.log("Checking if access token is still alive...");
      const tokenAlive = await checkIfAlive(accToken);
      if (tokenAlive) {
        // Token works!
        console.log("Token works!");
        // setAccessToken(accToken);
        document.getElementById("spotifyToken").innerHTML = accToken;
      }
      else {
        // Refresh token
        console.log("Token has expired. Refreshing token...");
        const refToken = await getRefreshToken();
        const newToken = await getNewToken(refToken);
        if (newToken !== -1) {
          console.log("New access token has been received from Spotify API. Updating token in database...");
          // Update the new access token in the database
          updateAccessToken(newToken);
          // setAccessToken(newToken);
          document.getElementById("spotifyToken").innerHTML = newToken;
        }
        else {
          console.log("Error: Unable to get new access token");
        }
      }
    };
    getTokenFromServer();
  }, []);

  async function checkIfTokenAlive(token) {
    console.log("Checking if access token is still alive...");
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
      return true;
    }
    else {
      console.log("Error: Unable to update access token in database");
      return false;
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
          const updateSuccessful = await updateAccessTokenInDatabase(data.access_token);
          // setAccessToken(data.access_token);
          if (updateSuccessful) {
            document.getElementById("spotifyToken").innerHTML = data.access_token;
            return true;
          }
          else {
            console.log("Error: Failed to update access token in database");
            return false;
          }
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

  function hideAlert() {
    document.getElementById("alertDialogue").style.display = "none";
  }

  function changeActiveTab(index) {
    setActiveTabIndex(index);
    const buttons = document.getElementsByClassName("MenuButton");
    for (let i = 0; i < buttons.length; i++) {
      if (i === index) {
        buttons[i].style.borderBottom = "5px solid white";
      }
      else {
        buttons[i].style.borderBottom = "0";
      }
    }
  }

  async function validateCredentials() {
    const username = document.getElementById("usernameInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();
    const errorDiv = document.getElementById("errorMessage");

    // Username validation
    if (username && username.length > 4) {
      // Check for whitespace
      if (/\s/.test(username)) {
        errorDiv.innerHTML = "Username cannot contain any whitespace characters";
        return;
      }
    }
    else {
      errorDiv.innerHTML = "Username must be at least 5 characters long";
      return;
    }
    errorDiv.innerHTML = "";

    // Password validation
    if (password && password.length > 7) {
      // Check for whitespace
      if (/\s/.test(password)) {
        errorDiv.innerHTML = "Password cannot contain any whitespace characters";
        return;
      }
    }
    else {
      errorDiv.innerHTML = "Password must be at least 8 characters long";
      return;
    }

    errorDiv.innerHTML = "";
    authenticateUser(username, password);
  }

  async function authenticateUser(userInput, passInput) {
    const userLowerInput = userInput.toLowerCase();
    const errorDiv = document.getElementById("errorMessage");
    const requestParameters = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await fetch("https://www.myxos.online/musicAPI/users/" + userLowerInput, requestParameters);
    if (response.status === 404) {
      errorDiv.innerHTML = "User does not exist";
      /*
      // Create user and store in database
      console.log("User not in database");
      const postParameters = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userLowerInput,
          password: hashCode(passInput).toString()
        })
      }
      const res = await fetch('https://www.myxos.online/musicAPI/users', postParameters);
      console.log(res.status);
      if (res.status === 201) {
        const data = await res.json();
        console.log("User created! Logging in...");
        setUser(data);
        // TODO: Softer animation to hide login screen (make a function for this)
      }
      else {
        errorDiv.innerHTML = "Unable to create user";
      }
      */
    }
    else {
      // Check if passwords match
      const data = await response.json();
      if (data.password === hashCode(passInput).toString()) {
        console.log("Password matched!");
        setUser(data);
        // TODO: Softer animation to hide login screen (make a function for this)
      }
      else {
        errorDiv.innerHTML = "Wrong username / password";
      }
    }
  }

  function hashCode(str) {
    for(var i = 0, h = 0; i < str.length; i++)
        h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    return h;
  }

  function requestToken() {
    return document.getElementById("spotifyToken").innerHTML;
  }

  return (
    <div className="App">
      {
        user === undefined ?
          <div id="loginScreen">
            <div className="loginContainer">
              <img className="loginLogo" src="vinyl.png" alt="app logo" />
              <div className="loginSeparator"></div>
              <input id="usernameInput" className="textInput" type="text" placeholder="Username"></input>
              <input id="passwordInput" className="textInput" type="password" placeholder="Password"></input>
              <button id="submitLogin" className="submitButton" onClick={validateCredentials}>Login</button>
              <div id="errorMessage"></div>
            </div>
          </div>
          :
          ""
      }
      <div id="alertDialogue">
        <div className="alertBox">
          <div id="alertTitle"></div>
          <div id="alertMessage"></div>
          <button className="alertButton" onClick={hideAlert}>OK</button>
        </div>
      </div>
      { activeTabIndex === 0 ?
          <AlbumsTab requestToken={requestToken} onTokenExpiration={handleExpiredToken} userInfo={user} />
        : ''
      }
      { activeTabIndex === 1 ?
          <AddTab requestToken={requestToken} onTokenExpiration={handleExpiredToken} userInfo={user} />
        : ''
      }
      { activeTabIndex === 2 ?
          <PlaylistTab requestToken={requestToken} onTokenExpiration={handleExpiredToken} userInfo={user} />
        : ''
      }
      <Menu onButtonClick={changeActiveTab} />
      <div id="spotifyToken"></div>
    </div>
  );
}

export default App;
