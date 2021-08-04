"use strict";

// SECTION: Manipulation with snapshot

// TODO: move to app? It does not work with database, but work with snapshot. Better name: convertSnapshotToCategoriesAndSubcategories() or getCategoriesAndSubcategoriesFromSnapshot(), but it is too long
const getCategoriesAndSubcategories = (snapshot) => {
  const categoriesAndSubcategories = new Array();

  snapshot.docs.forEach((doc) => {
    categoriesAndSubcategories.push(doc.data());
  });
  return categoriesAndSubcategories;
}

// TODO: move to app?
const getToolFromSnapshot = (snapshot) => {
  return snapshot.data();
}


// SECTION: Database queries

const downloadDatabaseSnapshot = async (collection) => {
  const snapshot = await db.collection(collection.toString()).get()
  return snapshot;
}

const downloadDatabaseDocument = async (reference) => {
  const snapshot = await reference.get()
  return snapshot;
}

const downloadToolsFromDatabase = async (ids) => {
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
  return batches.flat().sort((first, second) => first.id - second.id);
}

// SECTION: Transactions
// make 2 functions? downloadDatabaseDocument() and getToolFromSnapshot()?
const getDatabaseDocumentTransaction = (transaction, reference) => {
  return transaction
    .get(reference)
    .then((document) => {
      return document.data();
    })
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

const incrementCounterTransaction = async (transaction, counterRef) => {
  const numberOfTools = await getDatabaseDocumentTransaction(transaction, counterRef);
  const newCount = numberOfTools.count + 1;
  transaction.update(counterRef, { count: newCount });
  return newCount;
}

const createNewToolTransaction = async (transaction, counterRef, name, price, url, categories, subcategories) => {
  const newCount = await incrementCounterTransaction(transaction, counterRef);
  setToolTransaction(transaction, newCount, name, price, url, categories, subcategories);
  return newCount;
}

const createToolAndSaveUrlToCategories = (numberOfToolsRef, selectedCategoriesIds, toolName, toolPrice, toolUrl, selectedSubcategoriesIds) => {
  console.log("createToolAndSaveUrlToCategories()");
  return db.runTransaction(async (transaction) => {
    const oldCategories = await getDatabaseCollection("categories");
    const toolId = await createNewToolTransaction(transaction, numberOfToolsRef, toolName, toolPrice, toolUrl, selectedCategoriesIds, selectedSubcategoriesIds);

    selectedCategoriesIds.forEach(async (selectedCategoryId) => {
      const selectedOldCategories = findElementsById(oldCategories, selectedCategoryId);
      const newSubcategories = await addToolToSubcategories(selectedOldCategories, toolId, selectedSubcategoriesIds);
      updateSubcategories(transaction, selectedCategoryId, newSubcategories, selectedOldCategories);
      console.log(`Tool of ID ${toolId} saved in Firebase Firestore categories collection`);
    })
  }).then(() => {
    console.log("Transaction createToolAndSaveUrlToCategories() new tools is successfully commited!");
  }).catch((error) => {
    console.error("Transaction failed! ", error);
  });
}

const modifyToolAndSaveUrlToCategories = (modifiedToolId, toolName, toolPrice, toolUrl, selectedCategoriesIds, selectedSubcategoriesIds) => {
  console.log("modifyToolAndSaveUrlToCategories()");
  return db.runTransaction(async (transaction) => {
    const oldCategories = await getDatabaseCollection("categories");

    await deleteToolFromCategoriesTransaction(transaction, modifiedToolId);
    await setToolTransaction(transaction, modifiedToolId, toolName, toolPrice, toolUrl, selectedCategoriesIds, selectedSubcategoriesIds);
    
    selectedCategoriesIds.forEach(async (selectedCategoryId) => {
      const selectedOldCategories = findElementsById(oldCategories, selectedCategoryId);
      const newSubcategories = await addToolToSubcategories(selectedOldCategories, modifiedToolId, selectedSubcategoriesIds);
      updateSubcategories(transaction, selectedCategoryId, newSubcategories, selectedOldCategories);
      console.log(`Tool of ID ${modifiedToolId} updated in Firebase Firestore categories collection`);
    });
  }).then(() => {
    console.log("Transaction modifyToolAndSaveUrlToCategories() is successfully commited!");
  }).catch((error) => {
    console.error("Transaction failed! ", error);
  });
}

const getDeletedCategoriesTransactionDocuments = async (transaction, categories) => {
  let oldCategoriesDocs = categories.map(async (category) => {
    const categoryRef = db.collection("categories").doc(`0${parseInt(category)}`);
    const oldCategoryDoc = await getDatabaseDocumentTransaction(transaction, categoryRef);
    return oldCategoryDoc;
  });
  oldCategoriesDocs = await Promise.all(oldCategoriesDocs);
  return oldCategoriesDocs;
}

const deleteToolFromCategoriesTransaction = async (transaction, deletedToolId) => {
  const deletedToolRef = db.collection("tools").doc(`${deletedToolId}`);
  const deletedTool = await getDatabaseDocumentTransaction(transaction, deletedToolRef);
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

const deleteToolFromToolsTransaction = (transaction, id) => {
  const deletedTool = db.collection("tools").doc(`${id}`);
  transaction.delete(deletedTool);
}

const deleteToolDatabase = (id) => {
  return db.runTransaction(async (transaction) => {
    await deleteToolFromCategoriesTransaction(transaction, id);
    await deleteToolFromToolsTransaction(transaction, id);
  }).then(() => {
    console.log("Transaction delete is successfully commited!");
  }).catch((error) => {
    console.log(error)
  });
}

// SECTION: Write to database

const saveTool = async (imageUrl, toolName, toolPrice, toolCategories, selectedSubcategories, modifiedToolId) => {
  console.log("saveTool()");
  if (modifiedToolId !== -1) {
    await modifyToolAndSaveUrlToCategories(modifiedToolId, toolName, toolPrice, imageUrl, toolCategories, selectedSubcategories);
    const snapshot = await downloadDatabaseSnapshot("categories");
    categoriesAndSubcategoriesGlobal = getCategoriesAndSubcategories(snapshot);
  } else {
    const numberOfToolsRef = db.collection("tools").doc("#numberOfTools");
    await createToolAndSaveUrlToCategories(numberOfToolsRef, toolCategories, toolName, toolPrice, imageUrl, selectedSubcategories);
    const snapshot = await downloadDatabaseSnapshot("categories");
    categoriesAndSubcategoriesGlobal = getCategoriesAndSubcategories(snapshot);
  }
}

const saveImage = async (tool) => {
  console.log("saveImage()");
  const storageRef = storage.ref("images/" + tool.name);
  await storageRef.putString(tool.image, 'data_url');
   
  console.log('Image uploaded to Firebase Storage!');
  const imageUrl = await storageRef.getDownloadURL();
  return imageUrl;
}

// SECTION: TODO!

// Here or app?
const getDatabaseTool = async (id) => {
  const reference = db.collection("tools").doc(`${id}`);
  const snapshot = await downloadDatabaseDocument(reference);
  if (snapshot) {
    const tool = getToolFromSnapshot(snapshot);
    return tool;
  } else {
    console.log(`The tool ${id} does not exist in database`);
    //TODO display error message to user
    return false;
  }
}

// Here or app?
const addToolToSubcategories = (selectedOldCategory, toolId, selectedSubcategories) => {
  console.log("addToolToSubcategories()");
  return selectedOldCategory.subcategories.map((oldSubcategory) => {
    let newTools = [...(oldSubcategory.tools || [])];
    if (selectedSubcategories.includes(oldSubcategory.id) && !newTools.includes(toolId)) {
      newTools = [...newTools, toolId];
      return {
        ...oldSubcategory,
        tools: newTools.sort((first, second) => first - second)
      }
    } else {
      return oldSubcategory;
    }
  })
}

// Here or app?
const updateSubcategories = (transaction, selectedCategoryId, newSubcategories, selectedOldCategory) => {
  const categoryRef = db.collection("categories").doc(`0${selectedCategoryId}`);

  const newCategory = {
    ...selectedOldCategory,
    subcategories: newSubcategories
  }
  transaction.update(categoryRef, newCategory);
}

// here or app?
const getDatabaseCollection = async (collection) => {
  const categories = await downloadDatabaseSnapshot(collection);
  const categoriesAndSubcategories = await getCategoriesAndSubcategories(categories);
  return categoriesAndSubcategories;
}

// here or app?
const pickFile = () => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    const onFileInputChange = (e) => {
      console.log("onFileInputChange()");
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

// here or app?
const getFileTypeFrom64Url = (url) => {
  const firstPosition = url.indexOf("/");
  const lastPosition = url.indexOf(";");
  const type = url.slice(firstPosition + 1, lastPosition);
  return type;
}

// here or app?
const storeToolToDatabase = async (tool, imageChanged, modifiedToolId) => {
  console.log("storeToolToDatabase()");
  
  let imageUrl = null;
  if (imageChanged) {
    imageUrl = await saveImage(tool);
    await saveTool(imageUrl, tool.name, tool.price, tool.categories, tool.subcategories, modifiedToolId);
  } else {
    imageUrl = tool.image;
    await saveTool(imageUrl, tool.name, tool.price, tool.categories, tool.subcategories, modifiedToolId);
  }
}

// app?
const getToolValue = (element) => {
  return element.value;
}

// app?
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

// app? change name to setTool(), inside 2 functions getUserValues() and createTool()
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

// app?
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

//app?
const updateCategory = (oldCategoryDoc, subcategories, deletedToolId) => {
  const newTools = getNewTools(oldCategoryDoc, subcategories, deletedToolId, "0" + oldCategoryDoc.id);

  const newCategoryDoc = {
    ...oldCategoryDoc,
    subcategories: newTools
  }
  return newCategoryDoc;
}
