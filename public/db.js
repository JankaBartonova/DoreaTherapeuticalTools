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

const uploadImageUrlToDatabase = (storageRef, imgName, imgPrice) => {
  storageRef
    .getDownloadURL()
    .then((url) => {
      const numberOfToolsRef = db.collection("tools").doc("numberOfTools");
          
        numberOfToolsRef
          .get()
          .then((doc) => {
            const counter = doc.data().count;
            return counter;
          })
          .then((counter)=>{
            counter++;
            const increment = firebase.firestore.FieldValue.increment(1);
            const toolsRef = db.collection("tools").doc(`${counter}`);
            const numberOfToolsRef = db.collection("tools").doc("numberOfTools");
            const batch = db.batch()
            
            batch.set(toolsRef, {
                id: counter,
                name: imgName,
                image: url,
                price: imgPrice
              }, { merge: true })
            
            batch.update(numberOfToolsRef, { count: increment }, { merge: true })
            batch.commit();
          })
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
    const imgName = toolName.value;
    const imgPrice = toolPrice.value;
    // const toolCategoriesAndSubcategories = document.querySelectorAll(".select-pure__option--selected");
    
    // toolCategoriesAndSubcategories.forEach((categoryAndSubcategory) => {
    //   const values = categoryAndSubcategory.dataset.value;
    //   console.log(values);
    // }
    // const imgCategory = toolCategory.dataset.value;
    // console.log(imgCategory)
    // const imgSubcategory = toolSubcategory.value;

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
