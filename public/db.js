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

const setNewTool = (transaction, count, name, price, url) => {
  const toolsRef = db.collection("tools").doc(`${count}`);
  transaction.set(
    toolsRef,
    {
    id: count,
    name: name,
    image: url,
    price: price
    },
    { merge: true }
  );
  console.log("New tool saved to Firebase Firestore tool collection.");
}

const incrementCounter = async (transaction, counterRef) => {
  const numberOfTools = await getFirebaseTransactionDocument(transaction, counterRef);
  const newCount = numberOfTools.count + 1;
  transaction.update(counterRef, { count: newCount });
  return newCount;
}

const createNewTool = async (transaction, counterRef, name, price, url) => {
  const newCount = await incrementCounter(transaction, counterRef);
  setNewTool(transaction, newCount, name, price, url); 
  return newCount;
}

const addToolToSubcategories = (oldCategory, newCount, subcategories) => {
  return oldCategory.subcategories.map((subcategory) => {
    let newTools = [...(subcategory.tools || [])];
    if (subcategories.includes(subcategory.id) && !newTools.includes(newCount)) {
      newTools = [...newTools, newCount];
    }
    return {
      ...subcategory,
      tools: newTools
    };
  })
}

const updateCategory = (transaction, categoryRef, newCategory) => {
  transaction.update(categoryRef, newCategory);
}

const updateSubcategories = (transaction, categoryRef, oldCategory, newSubcategories) => {
  const newCategory = {
    ...oldCategory,
    subcategories: newSubcategories
  }
  updateCategory(transaction, categoryRef, newCategory);
}

const getFirebaseTransactionDocument = (transaction, reference) => {
  return transaction
    .get(reference)
    .then((document) => {
      console.log(document.data());
      return document.data();
    })
}

const createToolAndSaveUrlToCategories = (numberOfToolsRef, categoryRef, toolName, toolPrice, toolUrl, subcategories) => {
  return db.runTransaction(async (transaction) => {
    const oldCategory = await getFirebaseTransactionDocument(transaction, categoryRef);
    const toolId = await createNewTool(transaction, numberOfToolsRef, toolName, toolPrice, toolUrl);
    const newSubcategories = await addToolToSubcategories(oldCategory, toolId, subcategories);
    updateSubcategories(transaction, categoryRef, oldCategory, newSubcategories);
  }).then(() => {
    console.log("Transaction successfully commited!");
  }).catch((error) => {
    console.error("Transaction failed! ", error);
  });
}

const saveTool = (storageRef, toolName, toolPrice, toolCategories, selectedSubcategories) => {
  storageRef
    .getDownloadURL()
    .then((url) => {

      toolCategory = `0${toolCategories}`;

      const numberOfToolsRef = db.collection("tools").doc("numberOfTools");
      const categoryRef = db.collection("categories").doc(`${toolCategory}`);
      
      createToolAndSaveUrlToCategories(numberOfToolsRef, categoryRef, toolName, toolPrice, url, selectedSubcategories);
    });
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
  });
}

const getFileTypeFrom64Url = (url) => {
  const firstPosition = url.indexOf("/");
  const lastPosition = url.indexOf(";");
  const type = url.slice(firstPosition + 1, lastPosition);
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
      const toolSubcategories = [...tool.subcategories]
      console.log(toolSubcategories);
      saveTool(storageRef, tool.name, parseInt(tool.price), [...tool.categories], toolSubcategories);
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
  const subCategories = new Set();

  toolCategoriesAndSubcategories.forEach((value) => {
    if (value.includes(":")) {
      subCategories.add(value);
    } else {
      categories.add(value);
    }
  })

  return {
    categories: categories,
    subcategories: subCategories
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
    if (categoriesSelect) {
      categoriesSelect.reset();
    }
    if (subcategoriesSelect) {
      subcategoriesSelect.reset();
    }
  });

  const toolImage = await getImageAndShowAtDom(select);
  const imgType = getFileTypeFrom64Url(toolImage);
}
