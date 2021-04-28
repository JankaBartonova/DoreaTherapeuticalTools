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

const uploadImageUrlToDatabase = (storageRef, toolName, toolPrice, toolCategories, toolSubcategories) => {
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
            name: toolName,
            image: url,
            price: toolPrice
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

const pickFile = (input) => {
  return new Promise((resolve, reject) => {
    input.addEventListener("change", async (e) => {
      const selectedFile = input.files[0];
      if (selectedFile) {
        resolve(selectedFile);
      } else {
        reject("No file selected");
      }

      input.removeEventListener("change", this);
    });
    input.click(); 
    console.log("input clicked");
  });
}

const getFileTypeFrom64Url = (url) => {
  const firstPosition = url.indexOf("/");
  const lastPosition = url.indexOf(";");
  const type = url.slice(firstPosition + 1,lastPosition);
  console.log(type);
  return type;
}

const getImageAndShowAtDom = (select) => {
  return new Promise((resolve, reject) => {
    //dom
    select.addEventListener("click", async (e) => {
      //dom
      e.preventDefault()
      const input = document.createElement("input");
      input.type = "file";
      console.log("input", input)
    
      try {
        //app
        const selectedFile = await pickFile(input);
        const loadedImg = await loadFile(selectedFile);
        
        //dom
        document.querySelector(".myimage").src = loadedImg;

        if (loadedImg) {
          resolve(loadedImg);
        } 

      } catch (e) {
        console.log(e);
        reject("Can not load image!")
        // tady můžu dát zástupný obrázek
      }
    })
  })
}

const storeImageToDatabase = ({ tool }) => {
  console.log(tool)
  const storageRef = firebase.storage().ref("images/" + tool.name + `.${tool.type}`);

  storageRef
    .putString(tool.image, 'data_url')
    .then(() => {
        console.log('Uploaded file to Firebase Storage!');
        uploadImageUrlToDatabase(storageRef, tool.name, parseInt(tool.price), tool.categories, tool.subcategories);
      });
}  

const getToolValue = (element) => {
  return element.value;
}

const getMultiselectValues = () => {
  const toolMultiselectElements = document.querySelectorAll(".select-pure__option--selected");   
  const toolCategoriesAndSubcategories = Array.from(toolMultiselectElements).map((toolCategory) => {
    return toolCategory.dataset.value;
  });

  const categories = new Set();
  const subcategories = new Set();

  toolCategoriesAndSubcategories.forEach((value) => { 
    if (value.includes(":")) {
      subcategories.add(value);
      console.log(categories)
    } else {
      categories.add(value);
    }
  })
  return {
    categories: categories,
    subcategories: subcategories
  }
}

const getTool = (nameElement, priceElement, toolImage, imgType) => {
  const name = getToolValue(nameElement);
  const price = getToolValue(priceElement);

  const categoriesAndSubcategories = getMultiselectValues();
  const categories = categoriesAndSubcategories.categories;
  const subcategories = categoriesAndSubcategories.subcategories

  return {
    name: name,
    price: price,
    categories: categories,
    subcategories: subcategories,
    image: toolImage,
    type: imgType
  }
}

const uploadingToolToDatabase = async () => {
  const toolNameElement = document.getElementById("tool-name");
  const toolPriceElement = document.getElementById("tool-price");
  const select = document.getElementById("select");

  const form = document.getElementById("upload-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const tool = getTool(toolNameElement, toolPriceElement, toolImage, imgType);

    storeImageToDatabase({ tool });
    form.reset();
    document.querySelector(".myimage").src = "";
  });
  
  const toolImage = await getImageAndShowAtDom(select);
  const imgType = getFileTypeFrom64Url(toolImage);
}
