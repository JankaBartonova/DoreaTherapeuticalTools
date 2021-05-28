const loggedInLinks = document.querySelectorAll(".logged-in");
const loggedOutLinks = document.querySelectorAll(".logged-out");
const signupForm = document.querySelector("#signup-form");
const signupPopup = document.querySelector("#popup-signup-wrapper");
const loginPopup = document.querySelector("#popup-login-wrapper");
const logout = document.querySelector(".logout");
const signInForm = document.querySelector("#login-form");

// listen for users status change
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("User logged in: ", user);
    setupUiHeader(user, loggedInLinks, loggedOutLinks);
  } else {
    setupUiHeader(null, loggedInLinks, loggedOutLinks);
    console.log("User logged out!");
  }
})

// signup new user
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = signupForm["signup-email"].value;
  const password = signupForm["signup-password"].value;
  
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredentials) => {
      console.log(userCredentials.user);
      signupPopup.style = "none";
      signupForm.reset();
    })
    .catch((error) => {
      console.log(error.message);
  })
});

// logout user
logout.addEventListener("click", (e) => {
  e.preventDefault();
  auth.signOut();
})

// login user
signInForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = signInForm["login-email"].value;
  const password = signInForm["login-password"].value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      loginPopup.style = "none";
      signInForm.reset();
    })
    .catch((error) => console.log(error));
})
