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

const uploadImageUrlToDatabase = (storageRef, imgName, imgPrice, imgCategories, imgSubcategories) => {
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
          .then((counter) => {
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
            
            //imgCategories = "01";
            // imgCategories in a SET!!!!
            // const categoriesRef = db.collection("categories").doc(`${imgCategories}`)
            
            // batch.set(categoriesRef, {
            //  subcategories: [
            //     {
            //       tools: imgSubcategories
            //     }
            //   ]  
            // }, { merge: true })

            batch.commit();
          })
    })   
}

const uploadingFileToDatabase = () => {

  const form = document.getElementById("upload-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const toolCategoriesAndSubcategories = document.querySelectorAll(".select-pure__option--selected");
    console.log(Array.from(toolCategoriesAndSubcategories));
    
    const imgCategoriesAndSubcategories = Array.from(toolCategoriesAndSubcategories).map((imgCategory) => {
      return imgCategory.dataset.value;
    });
    console.log(imgCategoriesAndSubcategories)

    const imgCategories = new Set();
    const imgSubcategories = new Set();

    imgCategoriesAndSubcategories.forEach((value) => { 
      if (value.includes(":")) {
        imgSubcategories.add(value);
      } else {
        imgCategories.add(value);
      }
    })
    
    const toolName = document.getElementById("tool-name");
    const toolPrice = document.getElementById("tool-price");
    
    const imgName = toolName.value;
    const imgPrice = toolPrice.value;

    console.log(imgName, imgPrice, imgCategories, imgSubcategories);

    // Create function called storeImageToDatabase from the following code.
    const storageRef = firebase.storage().ref("images/" + imgName + ".jpg");
    
    storageRef
      .put(selectedFile)
      .then(() => {
          console.log('Uploaded file to Firebase Storage!');
          uploadImageUrlToDatabase(storageRef, imgName, parseInt(imgPrice), imgCategories, imgSubcategories);
        });

    form.reset();
    document.querySelector(".myimage").src = "";
  });
  
  const select = document.getElementById("select");
  
  select.addEventListener("click", (e) => {
    e.preventDefault()
    const input = document.createElement("input");
    input.type = "file";

    // přesunout do utils.js
    const loadFile = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", (e) => {
        console.log("loadend", e, { result: reader.result });
        if (reader.result == "data:") {
          reject("Empty image");
        } else {
          resolve(reader.result);
        }
      });

      reader.addEventListener("error", (e) => {
        console.log("error: ", e)
        reject(reader.error);
      })

      console.log("před readAsDataUrl")

      reader.readAsDataURL(file);
    });

    //TODO! fce pickfile (make promise from callback)
    const pickFile = (input) => 
      new Promise((resolve, reject) => {
        input.addEventListener("change", async (e) => {
          const selectedFile = input.files[0];
          if(selectedFile) {
            resolve(selectedFile);
          } else {
            reject("No file selected");
          }

          input.removeEventListener("change", this);
        });
        input.click(); 
      });

    console.log("input clicked");

    
      const loadedImg = await loadFile(selectedFile);

      if (loadedImg) {
        resolve(loadedImg);
      } else {
        reject("Can not load image!")
      }


    try {
      const selectedFile = await pickFile(input);
      const loadedImg = await loadFile(selectedFile);

      document.querySelector(".myimage").src = loadedImg;

      // resolve(selectedFiles)
    } catch (e) {
      console.log(e);
      // reject("error")
    }
    
    // TODO: Bubble selectedFile up.
  })
  console.log("Toto se spustí jako první")
}
    
    // // upload file
    // const toolName = document.getElementById("tool-name");
    // const toolPrice = document.getElementById("tool-price");
    // const imgName = toolName.value;
    // const imgPrice = toolPrice.value;

    // console.log(imgName, imgPrice)
    // const storageRef = firebase.storage().ref("images/" + imgName + ".jpg");
    
    // storageRef
    //   .put(selectedFile)
    //   .then(() => {
    //       console.log('Uploaded file to Firebase Storage!');
    //       uploadImageUrlToDatabase(storageRef, imgName, parseInt(imgPrice));
    //     });

  //   form.reset();
  // })
  
//}
