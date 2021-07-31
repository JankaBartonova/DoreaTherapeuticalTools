const getCategoriesAndSubcategories = (snapshot) => {
  const categoriesAndSubcategories = new Array();

  snapshot.docs.forEach((doc) => {
    categoriesAndSubcategories.push(doc.data());
  });
  return categoriesAndSubcategories;
}

const getCategories = (snapshot) => {
  const categoriesAndSubcategories = getCategoriesAndSubcategories(snapshot);
  const categories = categoriesAndSubcategories.map((category) => {
    return category.title;
  })
  return categories;
}

const getDatabaseCategoriesAndSubcategories = async (collection) => {
  const databaseCategoriesAndSubcategoriesSnapshot = await db.collection(collection.toString())
    .get()
  return databaseCategoriesAndSubcategoriesSnapshot;
}

const downloadToolsFromDatabase = async (ids) => {
  console.log("downloadToolsFromDatabase()");

  let batches = [];
  let idsCopy = ids.slice();
  while (idsCopy.length) {
    const batchIds = idsCopy.splice(0, 10);
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
  }
  return batches.flat();
}

const getSelectedTools = async (ids) => {
  try {
    if (!ids || !ids.length) {
      return [];
    }

    const selectedTools = await downloadToolsFromDatabase(ids);
    return selectedTools;

  } catch (error) {
    console.log(error);
  }
}

const setNewTool = (transaction, count, name, price, url, categories, subcategories) => {
  const toolsRef = db.collection("tools").doc(`${count}`);
  transaction.set(
    toolsRef,
    {
      id: count,
      name: name,
      image: url,
      price: price,
      categories: categories,
      subcategories: subcategories
    },
    { merge: true }
  );
  console.log(`Tool of ID ${count} saved to Firebase Firestore tool collection.`);
}

const incrementCounter = async (transaction, counterRef) => {
  const numberOfTools = await getFirebaseTransactionDocument(transaction, counterRef);
  const newCount = numberOfTools.count + 1;
  transaction.update(counterRef, { count: newCount });
  return newCount;
}

const createNewTool = async (transaction, counterRef, name, price, url, categories, subcategories) => {
  const newCount = await incrementCounter(transaction, counterRef);
  setNewTool(transaction, newCount, name, price, url, categories, subcategories);
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

const findElementsById = (arrayOfObjects, id) => {
  return arrayOfObjects.find((object) => {
    return object.id == id;
  })
}

const createToolAndSaveUrlToCategories = (numberOfToolsRef, selectedCategoriesIds, toolName, toolPrice, toolUrl, selectedSubcategoriesIds) => {
  return db.runTransaction(async (transaction) => {
    const oldCategories = await getFirebaseCollection("categories");
    const toolId = await createNewTool(transaction, numberOfToolsRef, toolName, toolPrice, toolUrl, selectedCategoriesIds, selectedSubcategoriesIds);

    selectedCategoriesIds.forEach(async (selectedCategoryId) => {
      const selectedOldCategories = findElementsById(oldCategories, selectedCategoryId);
      const newSubcategories = await addToolToSubcategories(selectedOldCategories, toolId, selectedSubcategoriesIds);
      updateSubcategories(transaction, selectedCategoryId, newSubcategories, selectedOldCategories);
    })
  }).then(() => {
    console.log("Transaction create new tools is successfully commited!");
  }).catch((error) => {
    console.error("Transaction failed! ", error);
  });
}

const modifyToolAndSaveUrlToCategories = (modifiedToolId, toolName, toolPrice, toolUrl, selectedCategoriesIds, selectedSubcategoriesIds) => {
  return db.runTransaction(async (transaction) => {
    const oldCategories = await getFirebaseCollection("categories");
    console.log(oldCategories);
    console.log(selectedCategoriesIds);
    const toolId = await setNewTool(transaction, modifiedToolId, toolName, toolPrice, toolUrl, selectedCategoriesIds, selectedSubcategoriesIds);

    // selectedCategoriesIds.forEach(async (selectedCategoryId) => {
    //   const selectedOldCategories = findElementsById(oldCategories, selectedCategoryId);
    //   const newSubcategories = await addToolToSubcategories(selectedOldCategories, toolId, selectedSubcategoriesIds);
    //   updateSubcategories(transaction, selectedCategoryId, newSubcategories, selectedOldCategories);
    // })
  }).then(() => {
    console.log("Transaction modify new tools is successfully commited!");
  }).catch((error) => {
    console.error("Transaction failed! ", error);
  });
}

const getFirebaseCollection = async (collection) => {
  const categories = await getDatabaseCategoriesAndSubcategories(collection);
  const databaseSnapshot = await getCategoriesAndSubcategories(categories);
  return databaseSnapshot;
}


const saveTool = (storageRef, toolName, toolPrice, toolCategories, selectedSubcategories, modifiedToolId) => {
  storageRef
    .getDownloadURL()
    .then((url) => {
      if (modifiedToolId) {
        console.log(modifiedToolId);
        console.log("Modified tool. Save it to database tool collection");
        //const modifiedToolRef = db.collection("tools").doc("modifiedToolId");
        modifyToolAndSaveUrlToCategories(modifiedToolId, toolName, toolPrice, url, toolCategories, selectedSubcategories);
      } else {
        const numberOfToolsRef = db.collection("tools").doc("#numberOfTools");
        createToolAndSaveUrlToCategories(numberOfToolsRef, toolCategories, toolName, toolPrice, url, selectedSubcategories);
      }
    });
}

const pickFile = () => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    const onFileInputChange = (e) => {
      console.log("on file input change");
      const selectedFile = input.files[0];
      input.removeEventListener("change", onFileInputChange);
      if (selectedFile) {
        resolve(selectedFile);
      } else {
        reject("No file selected");
      }
    };
    input.addEventListener("change", onFileInputChange);
    input.click();
  });
}

const getFileTypeFrom64Url = (url) => {
  const firstPosition = url.indexOf("/");
  const lastPosition = url.indexOf(";");
  const type = url.slice(firstPosition + 1, lastPosition);
  return type;
}

const storeToolToDatabase = ({ tool }, imageChanged, modifiedToolId) => {
  console.log("storeToolToDatabase()");

  if (imageChanged) {
    console.log("the image was changed, save it to storage")
    const storageRef = storage.ref("images/" + tool.name);
    storageRef
      .putString(tool.image, 'data_url')
      .then(() => {
        console.log('Uploaded file to Firebase Storage!');
        const toolSubcategories = [...tool.subcategories]
        saveTool(storageRef, tool.name, parseInt(tool.price), [...tool.categories], toolSubcategories, modifiedToolId);
      });
  } else {
    console.log("Image was not changed, make some code here!")    
  }
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

const getTool = (nameElement, priceElement, toolImage) => {
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
    image: toolImage
  }
}

const getNewTools = (oldCategoryDoc, subcategories, deletedToolId) => {
  return oldCategoryDoc.subcategories.map((subcategory) => {
    if (subcategories.includes(subcategory.id)) {
      const tools = subcategory.tools.filter((tool) => {
        return tool != deletedToolId;
      })

      const newSubcategoryDoc = {
        ...subcategory,
        tools: tools
      }
      return newSubcategoryDoc;
    }
    return subcategory;
  })
}

const getDeletedCategoriesTransactionDocuments = async (transaction, categories) => {
  let oldCategoriesDocs = categories.map(async (category) => {
    const categoryRef = db.collection("categories").doc(`0${parseInt(category)}`);
    const oldCategoryDoc = await getFirebaseTransactionDocument(transaction, categoryRef);
    return oldCategoryDoc;
  });
  oldCategoriesDocs = await Promise.all(oldCategoriesDocs);
  return oldCategoriesDocs;
}

const updateCategory = (oldCategoryDoc, subcategories, deletedToolId) => {
  const newTools = getNewTools(oldCategoryDoc, subcategories, deletedToolId, "0" + oldCategoryDoc.id);

  const newCategoryDoc = {
    ...oldCategoryDoc,
    subcategories: newTools
  }
  return newCategoryDoc;
}

const deleteToolFromCategories = async (transaction, deletedToolId) => {
  const deletedToolRef = db.collection("tools").doc(`${deletedToolId}`);
  const deletedTool = await getFirebaseTransactionDocument(transaction, deletedToolRef);
  if (!deletedTool) {
    throw "Document does not exist!";
  }
  const categories = deletedTool.categories;
  const subcategories = deletedTool.subcategories;

  const oldCategoriesDocs = await getDeletedCategoriesTransactionDocuments(transaction, categories);

  oldCategoriesDocs.forEach((oldCategoryDoc) => {
    const newCategoryDoc = updateCategory(oldCategoryDoc, subcategories, deletedToolId);

    const categoryRef = db.collection("categories").doc("0" + oldCategoryDoc.id);
    transaction.update(categoryRef, newCategoryDoc);
  });
}

const deleteToolFromTools = (transaction, id) => {
  const deletedTool = db.collection("tools").doc(`${id}`);
  transaction.delete(deletedTool);
}

const deleteToolDatabase = (id) => {
  return db.runTransaction(async (transaction) => {
    await deleteToolFromCategories(transaction, id);
    await deleteToolFromTools(transaction, id);
  }).then(() => {
    console.log("Transaction delete is successfully commited!");
  }).catch((error) => {
    console.log(error)
  });
}
