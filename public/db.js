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
    console.log("batchIds", batchIds);
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
  return batches.flat().sort((first, second) => first.id - second.id);
}

const getSelectedTools = async (ids) => {
  try {
    if (!ids || !ids.length) {
      return [];
    }

    const selectedTools = await downloadToolsFromDatabase(ids);
    console.log(selectedTools);
    return selectedTools;

  } catch (error) {
    console.log(error);
  }
}

const setToolTransaction = (transaction, count, name, price, url, categories, subcategories) => {
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
  setToolTransaction(transaction, newCount, name, price, url, categories, subcategories);
  return newCount;
}

const addToolToSubcategories = (selectedOldCategory, toolId, selectedSubcategories) => {
  console.log("addToolToSubcategories()");
  console.log("selectedOldCategory, toolId, selectedSubcategories: ", selectedOldCategory, toolId, typeof(toolId), selectedSubcategories)
  return selectedOldCategory.subcategories.map((oldSubcategory) => {
    let newTools = [...(oldSubcategory.tools || [])];
    if (selectedSubcategories.includes(oldSubcategory.id) && !newTools.includes(toolId)) {
      newTools = [...newTools, toolId];
      console.log("Type of tools in subcategories", newTools[0], typeof(newTools[0]));
      console.log(newTools.sort((first, second) => first - second));
      return {
        ...oldSubcategory,
        tools: newTools.sort((first, second) => first - second)
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
  console.log("createToolAndSaveUrlToCategories()");
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
  console.log("modifyToolAndSaveUrlToCategories()");
  return db.runTransaction(async (transaction) => {
    const oldCategories = await getFirebaseCollection("categories");

    await deleteToolFromCategoriesTransaction(transaction, modifiedToolId);
    await setToolTransaction(transaction, modifiedToolId, toolName, toolPrice, toolUrl, selectedCategoriesIds, selectedSubcategoriesIds);
    
    selectedCategoriesIds.forEach(async (selectedCategoryId) => {
      const selectedOldCategories = findElementsById(oldCategories, selectedCategoryId);
      console.log(selectedOldCategories);
      console.log(modifiedToolId, typeof(modifiedToolId));
      const newSubcategories = await addToolToSubcategories(selectedOldCategories, modifiedToolId, selectedSubcategoriesIds);
      console.log(newSubcategories);
      updateSubcategories(transaction, selectedCategoryId, newSubcategories, selectedOldCategories);
    });
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

const saveTool = (imageUrl, toolName, toolPrice, toolCategories, selectedSubcategories, modifiedToolId) => {
  console.log("saveTool()");
  if (modifiedToolId !== -1) {
    console.log("Modified tool.");
    console.log("modifiedToolId", modifiedToolId);
    //const modifiedToolRef = db.collection("tools").doc("modifiedToolId");
    modifyToolAndSaveUrlToCategories(modifiedToolId, toolName, toolPrice, imageUrl, toolCategories, selectedSubcategories);
  } else {
    console.log("New tool.");
    console.log("modifiedToolId", modifiedToolId);
    const numberOfToolsRef = db.collection("tools").doc("#numberOfTools");
    createToolAndSaveUrlToCategories(numberOfToolsRef, toolCategories, toolName, toolPrice, imageUrl, selectedSubcategories);
  }
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

const saveImage = async (tool) => {
  const storageRef = storage.ref("images/" + tool.name);
  await storageRef.putString(tool.image, 'data_url');
   
  console.log('Uploaded file to Firebase Storage!');
  const imageUrl = await storageRef.getDownloadURL();
  return imageUrl;
}

const storeToolToDatabase = async (tool, imageChanged, modifiedToolId) => {
  console.log("storeToolToDatabase()");
  console.log("tool, imageChanged, modifiedToolId", tool, imageChanged, modifiedToolId, typeof(modifiedToolId));

  let imageUrl = null;
  if (imageChanged) {
    console.log("the image was changed, save it to storage");
    imageUrl = await saveImage(tool);
    await saveTool(imageUrl, tool.name, tool.price, tool.categories, tool.subcategories, modifiedToolId);
  } else {
    console.log("the image was not changed, save it to firestore");
    imageUrl = tool.image;
    await saveTool(imageUrl, tool.name, tool.price, tool.categories, tool.subcategories, modifiedToolId);
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
    price: parseInt(price),
    categories: [...categories],
    subcategories: [...subcategories],
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

const deleteToolFromCategoriesTransaction = async (transaction, deletedToolId) => {
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
    await deleteToolFromCategoriesTransaction(transaction, id);
    await deleteToolFromTools(transaction, id);
  }).then(() => {
    console.log("Transaction delete is successfully commited!");
  }).catch((error) => {
    console.log(error)
  });
}
