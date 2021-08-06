"use strict";
const login = document.querySelector(".login");
const logout = document.querySelector(".logout");

// login using Google
const provider = new firebase.auth.GoogleAuthProvider();

login.addEventListener("click", (e) => {
  console.log("Login button clicked");

  auth.signInWithPopup(provider)
    .then((result) => {
    }).catch((error) => {
      console.log(error.message);
    });
})

logout.addEventListener("click", (e) => {
  auth.signOut();
})
