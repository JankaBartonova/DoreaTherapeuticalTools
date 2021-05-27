auth.createUserWithEmailAndPassword(email, password)
  .then((userCredentials) => {
    console.log(userCredentials.user);
  })
  .catch((error) => {
    console.log(error.message);
  })