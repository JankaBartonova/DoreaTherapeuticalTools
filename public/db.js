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

const saveNewToolAndIncrementCounter = (transaction, counterDoc, counterRef, toolName, toolPrice, url) => {
  const newCount = counterDoc.data().count + 1;
  setNewTool(transaction, newCount, toolName, toolPrice, url);
  transaction.update(counterRef, { count: newCount });
  return newCount;
}

const addNewToolToSelectedSubcategories = (oldCategory, newCount, selectedSubcategories) => {
  let newSubcategories = [];
  oldCategory.subcategories.forEach((subcategory) => {
    let newTools = [...(subcategory.tools || [])];
    if (selectedSubcategories.includes(subcategory.id) && !newTools.includes(newCount)) {
      newTools = [...newTools, newCount];
    }
    let newSubcategory = {
      ...subcategory,
      tools: newTools
    };
    newSubcategories = [...newSubcategories, newSubcategory];
  });
  return newSubcategories;
}

const updateCategory = (transaction, categoryRef, oldCategory, newSubcategories) => {
  const newCategory = {
    ...oldCategory,
    subcategories: newSubcategories
  }
  transaction.update(categoryRef, newCategory);
}

const getCategoryDoc = (transaction, categoryRef) => {
  return transaction
  .get(categoryRef)
  .then((categoryDoc) => {
    console.log(categoryDoc.data());
    return categoryDoc.data();
  })
}

const uploadToolUrlToDatabase = (storageRef, toolName, toolPrice, toolCategories, selectedSubcategories) => {
  storageRef
    .getDownloadURL()
    .then((url) => {

      toolCategory = `0${toolCategories}`;

      const numberOfToolsRef = db.collection("tools").doc("numberOfTools");
      const categoryRef = db.collection("categories").doc(`${toolCategory}`);

      return db.runTransaction((transaction) => {
        return transaction
          .get(numberOfToolsRef)
          .then(async (numberOfToolsDoc) => {
            
            
            const oldCategory =  await getCategoryDoc(transaction, categoryRef);
            console.log(oldCategory)
            const newCount = await saveNewToolAndIncrementCounter(transaction, numberOfToolsDoc, numberOfToolsRef, toolName, toolPrice, url);
            const newSubcategories = await addNewToolToSelectedSubcategories(oldCategory, newCount, selectedSubcategories);
            updateCategory(transaction, categoryRef, oldCategory, newSubcategories);
          })
      }).then(() => {
        console.log("Transaction successfully commited!");
      }).catch((error) => {
        console.log("Transaction failed! ", error);
      });
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
      uploadToolUrlToDatabase(storageRef, tool.name, parseInt(tool.price), [...tool.categories], toolSubcategories);
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
