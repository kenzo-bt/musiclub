export const CLIENT_ID = "9cb9b55a9f4f402a8a250030f7c35468";
export const CLIENT_SECRET = "e7a704cc2a4341279936c2feaee4cbe6";
export const PLAYLIST_ID = "3Z9UoDIlecIROC1I6HYG91";

export function showAlert(title, message) {
  document.getElementById("alertTitle").innerHTML = title;
  document.getElementById("alertMessage").innerHTML = message;
  document.getElementById("alertDialogue").style.display = "flex";
}
