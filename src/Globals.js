export const PLAYLIST_ID = "3Z9UoDIlecIROC1I6HYG91"; // ID for the playlist where common songs are added
export const API_URL = "https://www.myxos.online/musicAPI/";

export function showAlert(title, message) {
  document.getElementById("alertTitle").innerHTML = title;
  document.getElementById("alertMessage").innerHTML = message;
  document.getElementById("alertDialogue").style.display = "flex";
}

export function getLocalToken() {
  return document.getElementById("spotifyToken").innerHTML;
}
