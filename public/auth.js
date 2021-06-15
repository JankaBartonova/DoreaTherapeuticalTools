const signupForm = document.querySelector("#signup-form");
const signupPopup = document.querySelector("#popup-signup-wrapper");
const loginPopup = document.querySelector("#popup-login-wrapper");
const logout = document.querySelector(".logout");
const signInForm = document.querySelector("#login-form");
const createTool = document.querySelector(".create-tool");

// signup new user
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = signupForm["signup-email"].value;
  const password = signupForm["signup-password"].value;
  
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredentials) => {
      console.log(userCredentials.user);
      signupPopup.classList.add("d-none");
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
      loginPopup.classList.add("d-none");
      signInForm.reset();
    })
    .catch((error) => console.log(error));
})
