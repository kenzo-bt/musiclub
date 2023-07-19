import './App.css';
import AddTab from './components/AddTab.js';
import AlbumsTab from './components/AlbumsTab.js';
import PlaylistTab from './components/PlaylistTab.js';
import Menu from './components/Menu.js';
import { useEffect, useState } from 'react';
import { API_URL } from './Globals.js';
import bcrypt from 'bcryptjs-react';

function App() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [user, setUser] = useState(undefined);

  // useEffect will run only once when application loads
  useEffect(() => {
    async function getAccessToken() {
      const params = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
      const res = await fetch(API_URL + "auth/accessToken", params);
      if (res.status === 200) {
        const data = await res.json();
        console.log("Fetched working token from server: " + data.accessToken);
        document.getElementById("spotifyToken").innerHTML = data.accessToken;
      }
      else {
        console.log("Error: Unable to fetch a working token from server");
      }
    }
    getAccessToken();
  }, []);

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

    const response = await fetch(API_URL + "users/" + userLowerInput, requestParameters);
    if (response.status === 404) {
      errorDiv.innerHTML = "User does not exist";
    }
    else {
      // Check if passwords match
      const data = await response.json();
      if (bcrypt.compareSync(passInput, data.password)) {
        console.log("Password matched!");
        setUser(data);
        // TODO: Softer animation to hide login screen (make a function for this)
      }
      else {
        errorDiv.innerHTML = "Wrong username / password";
      }
    }
  }

  async function requestNewToken() {
    const params = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
    const res = await fetch(API_URL + "auth/accessToken", params);
    if (res.status === 200) {
      const data = await res.json();
      console.log("Fetched working token from server: " + data.accessToken);
      document.getElementById("spotifyToken").innerHTML = data.accessToken;
      return true;
    }
    else {
      console.log("Error: Unable to fetch a working token from server");
      return false;
    }
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
          <AlbumsTab requestToken={requestNewToken} userInfo={user} />
        : ''
      }
      { activeTabIndex === 1 ?
          <AddTab requestToken={requestNewToken} userInfo={user} />
        : ''
      }
      { activeTabIndex === 2 ?
          <PlaylistTab requestToken={requestNewToken} userInfo={user} />
        : ''
      }
      <Menu onButtonClick={changeActiveTab} />
      <div id="spotifyToken"></div>
    </div>
  );
}

export default App;
