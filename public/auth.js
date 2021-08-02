"use strict";

const signupForm = document.querySelector("#signup-form");
const signupPopup = document.querySelector("#popup-signup-wrapper");
const loginPopup = document.querySelector("#popup-login-wrapper");
const logout = document.querySelector(".logout");
const login = document.querySelector(".login");
const signInForm = document.querySelector("#login-form");
const createTool = document.querySelector(".create-tool");
const loginGoogle = document.querySelector("#login-google");
const logoutGoogle = document.querySelector("#logout-google");

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

// logout
logout.addEventListener("click", (e) => {
  auth.signOut();
})
