const getDatabaseCategoriesAndSubcategories = async (collection) => {
  const databaseCategoriesAndSubcategoriesSnapshot = await db.collection(collection.toString())
    .get()
    .then((snapshot) => {
      return snapshot
    })
  return databaseCategoriesAndSubcategoriesSnapshot;
}

const downloadToolsFromDatabase = async (ids) => {
  let batches = [];
  while (ids.length) {
    const batchIds = ids.splice(0, 10);
    batches.push(
      await db.collection("tools")
        .where(
          "id",
          'in',
          [...batchIds]
        )
        .get()
        .then(results => results.docs.map(result => ({ ...result.data() })))
    )
    return batches;
  }
}

const getSelectedCards = async (ids) => {
  try {
    if (!ids || !ids.length) {
      return false;
    }

    const selectedToolsBatches = await downloadToolsFromDatabase(ids);
    const selectedTools = await createArrayFromArrayOfArrays(selectedToolsBatches);
    return selectedTools;

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
  console.log(`New tool od ID ${count} saved to Firebase Firestore tool collection.`);
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

const addToolToSubcategories = (selectedOldCategory, newCount, selectedSubcategories) => {
  return selectedOldCategory.subcategories.map((oldSubcategory) => {
    let newTools = [...(oldSubcategory.tools || [])];
    if (selectedSubcategories.includes(oldSubcategory.id) && !newTools.includes(newCount)) {
      newTools = [...newTools, newCount];
      return {
        ...oldSubcategory,
        tools: newTools
      }
    } else {
      return oldSubcategory;
    }
  })
}



const updateSubcategories = (transaction, selectedCategoryId, newSubcategories, selectedOldCategory) => {
  const categoryRef = db.collection("categories").doc(`0${selectedCategoryId}`);
  
  const newCategory = {
    ...selectedOldCategory,
    subcategories: newSubcategories
  }
  console.log(newCategory)
  transaction.update(categoryRef, newCategory);
}

const getFirebaseTransactionDocument = (transaction, reference) => {
  return transaction
    .get(reference)
    .then((document) => {
      return document.data();
    })
}

const createToolAndSaveUrlToCategories = (numberOfToolsRef, selectedCategoriesIds, toolName, toolPrice, toolUrl, selectedSubcategories) => {
  return db.runTransaction(async (transaction) => {
    const oldCategories = await getFirebaseCollection("categories");
    const toolId = await createNewTool(transaction, numberOfToolsRef, toolName, toolPrice, toolUrl);

    console.log(selectedSubcategories)
    selectedCategoriesIds.forEach(async (selectedCategoryId) => {
      console.log(selectedCategoryId)

      const selectedOldCategory = oldCategories.find((oldCategory) => {
        return oldCategory.id == selectedCategoryId;
      })

      const newSubcategories = await addToolToSubcategories(selectedOldCategory, toolId, selectedSubcategories);

      updateSubcategories(transaction, selectedCategoryId, newSubcategories, selectedOldCategory);
    })
  }).then(() => {
    console.log("Transaction successfully commited!");
  }).catch((error) => {
    console.error("Transaction failed! ", error);
  });
}

const getFirebaseCollection = async (collection) => {
  const categories = await getDatabaseCategoriesAndSubcategories(collection);
  const databaseSnapshot = await getCategoriesAndSubcategories(categories);
  return databaseSnapshot;
}


const saveTool = (storageRef, toolName, toolPrice, toolCategories, selectedSubcategories) => {
  storageRef
    .getDownloadURL()
    .then((url) => {
      // ["1", "2"]

      //toolCategory = `0${toolCategories}`;

      const numberOfToolsRef = db.collection("tools").doc("#numberOfTools");
      //const categoryRef = db.collection("categories").doc(`${toolCategory}`);

      createToolAndSaveUrlToCategories(numberOfToolsRef, toolCategories, toolName, toolPrice, url, selectedSubcategories);
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
