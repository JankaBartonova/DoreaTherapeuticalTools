const getDatabaseCategoriesAndSubcategories = async (collection) => {
  const databaseCategoriesAndSubcategoriesSnapshot = await db.collection(collection.toString())
    .get()
    .then((snapshot) => {
      return snapshot 
    })
  return databaseCategoriesAndSubcategoriesSnapshot;
}

const getSelectedCards = async (tools) => {
  try {
    const selectedToolsDatabaseSnapshot = await db.collection("tools")
    .where("id", "in", tools)
    .get()
    
    console.log("Selected tools returned from database");
    return selectedToolsDatabaseSnapshot.docs.map((databaseTool) => {
      return databaseTool.data()
    });

  } catch (error) {
    console.log(error);
  }
}

const uploadImageUrlToDatabase = async (storageRef, imgName, imgPrice) => {
  await storageRef
    .getDownloadURL()
    .then((url) => {
      // Create new document within a collection
      const tools = db.collection("tools");

      tools.add({
        name: imgName,
        image: url,
        price: imgPrice
      }, { merge: true })

      console.log("New document was added Firebase Firestore! (without readeable ID!)");
    })
}

const uploadingFileToDatabase = () => {
  const fileInput = document.querySelector(".myfiles");
  
  fileInput.addEventListener("change", e => {
    // get image from PC and show it in dom
    const files = e.target.files;
    console.log(files);
    const reader = new FileReader();
    reader.onload = () => {
      document.querySelector(".myimage").src = reader.result;
    }
    reader.readAsDataURL(files[0]);

    // upload file
    const toolName = document.getElementById("tool-name");
    const toolPrice = document.getElementById("tool-price");
    const imgName = toolName.value
    const imgPrice = toolPrice.value
    console.log(imgName, imgPrice)
    const storageRef = firebase.storage().ref("images/" + imgName + ".jpg");
    storageRef
      .put(files[0])
      .then(() => {
          console.log('Uploaded file to Firebase Storage!');
          uploadImageUrlToDatabase(storageRef, imgName, parseInt(imgPrice));
        });
      });
    // const storageRef = firebase.storage().ref("images/" + file.name);

    // storageRef
    //   .put(file)
    //   .then(() => {
    //     console.log('Uploaded file to Firebase Storage!');
    //     uploadImageUrlToDatabase(storageRef);
    //   });
  //});
}



// const uploadImageUrlToDatabase = (storageRef) => {
//   storageRef
//     .getDownloadURL()
//     .then((url) => {
//       // TODO reference document (for now hardcoded .doc(1))
//       const tools = db.collection("tools").doc("3");

//       tools.set({
//         image: url
//       }, { merge: true });

//       console.log("Image URL was added to Firebase Firestore!");
//     })
// }


// const uploadingFileToDatabase = () => {
//   const fileInput = document.querySelector(".myfiles");
  
//   fileInput.addEventListener("change", e => {
//     const file = e.target.files[0];
//     const storageRef = firebase.storage().ref("images/" + file.name);

//     storageRef
//       .put(file)
//       .then(() => {
//         console.log('Uploaded file to Firebase Storage!');
//         uploadImageUrlToDatabase(storageRef);
//       });
//   });
// }
