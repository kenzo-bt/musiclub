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
    async function tryCookieLogin() {
      // Check if cookie exists in browser
      const cookieName = "loginRemember";
      if (document.cookie.split(";").some((item) => item.trim().startsWith(cookieName + "="))) {
        const cookieValue = document.cookie.split("; ").find((row) => row.startsWith(cookieName + "="))?.split("=")[1];
        const params = {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
        const response = await fetch(API_URL + "cookies/login/" + cookieValue, params);
        if (response.status === 200) {
          const data = await response.json();
          setUser(data);
        }
      }
      // Hide loading indicator
      document.getElementById("cookieLoadingIcon").style.display = "none";
      document.getElementById("processingCookies").style.opacity = 0;
      setTimeout(() => {
        document.getElementById("processingCookies").style.display = "none";
      }, 1000)
    }

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
        document.getElementById("spotifyToken").innerHTML = data.accessToken;
      }
      else {
        console.log("Error: Unable to fetch a working token from server");
      }
    }
    tryCookieLogin();
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

  function getRandomString() {
    // Possibilites = 3.22 × 10^21 -> ~3 sextillion -> ~50K years to bruteforce
    const keySpace = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const keyLength = 12;
    let key = "";
    for (let i = 0; i < keyLength; i++) {
      key += keySpace.charAt(Math.floor(Math.random() * keySpace.length));
    }
    return key;
  }

  async function sendCookieToServer(userId, loginCookie) {
    const requestParameters = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const response = await fetch(API_URL + "cookies/set/" + userId + "/" + loginCookie, requestParameters);
    if (response.status !== 200) {
      console.log("Error: Unable to set cookie in server");
    }
  }

  async function authenticateUser(userInput, passInput) {
    const userLowerInput = userInput.toLowerCase();
    const errorDiv = document.getElementById("errorMessage");
    const rememberMeSelected = document.getElementById("rememberLoginBox").checked;
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
        // If user checked the "Remember this device" checkbox, create cookie and send to server
        if (rememberMeSelected) {
          const userAgent = window.navigator.userAgent;
          const os = userAgent.slice(userAgent.indexOf("(") + 1, userAgent.indexOf(";"));
          const newCookie = encodeURIComponent(os) + ":" + getRandomString();
          const cookieTime = 30 * 24 * 60 * 60; // 30 days
          document.cookie = "loginRemember=" + newCookie + "; SameSite=None; max-age=" + cookieTime + "; Secure";
          const cookieValue = document.cookie.split("; ").find((row) => row.startsWith("loginRemember="))?.split("=")[1];
          sendCookieToServer(data.id, cookieValue);
        }
        // Set the user data as state
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
      <div id="processingCookies">
        <div id="cookieLoadingIcon">
          <div className="lds-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      {
        user === undefined ?
          <div id="loginScreen">
            <div className="loginContainer">
              <img className="loginLogo" src={require("./images/vinyl.png")} alt="app logo" />
              <div className="loginSeparator"></div>
              <input id="usernameInput" className="textInput" type="text" placeholder="Username"></input>
              <input id="passwordInput" className="textInput" type="password" placeholder="Password"></input>
              <button id="submitLogin" className="submitButton" onClick={validateCredentials}>Login</button>
              <div className="rememberMeContainer">
                <input type="checkbox" id="rememberLoginBox" name="rememberMe" />
                <label for="rememberMe">Remember this device</label>
              </div>
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
