"use strict";

// SECTION: Manipulation with snapshot

const getCategoriesAndSubcategories = (snapshot) => {
  const categoriesAndSubcategories = new Array();

  snapshot.docs.forEach((doc) => {
    categoriesAndSubcategories.push(doc.data());
  });
  return categoriesAndSubcategories;
}

// SECTION: Database queries and data modeling

const downloadDatabaseCollection = async (collection) => {
  const snapshot = await db.collection(collection.toString()).get()
  collection = getCategoriesAndSubcategories(snapshot);
  return collection;
}

const downloadDatabaseDocument = async (reference) => {
  const snapshot = await reference.get()
  return snapshot.data();
}

const downloadDatabaseTool = async (id) => {
  const reference = db.collection("tools").doc(`${id}`);
  const tool = await downloadDatabaseDocument(reference);
  return tool;
}

const downloadDatabaseTools = async (ids) => {
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

const updateSubcategoriesTransactions = (transaction, selectedCategoryId, newSubcategories, selectedOldCategory) => {
  const categoryRef = db.collection("categories").doc(`0${selectedCategoryId}`);

  const newCategory = {
    ...selectedOldCategory,
    subcategories: newSubcategories
  }
  transaction.update(categoryRef, newCategory);
}

const createToolAndSaveUrlToCategories = (numberOfToolsRef, selectedCategoriesIds, toolName, toolPrice, toolUrl, selectedSubcategoriesIds) => {
  console.log("createToolAndSaveUrlToCategories()");
  return db.runTransaction(async (transaction) => {
    const oldCategories = await downloadDatabaseCollection("categories");
    const toolId = await createNewToolTransaction(transaction, numberOfToolsRef, toolName, toolPrice, toolUrl, selectedCategoriesIds, selectedSubcategoriesIds);

    selectedCategoriesIds.forEach(async (selectedCategoryId) => {
      const selectedOldCategories = findElementsById(oldCategories, selectedCategoryId);
      const newSubcategories = await addToolToSubcategories(selectedOldCategories, toolId, selectedSubcategoriesIds);
      updateSubcategoriesTransactions(transaction, selectedCategoryId, newSubcategories, selectedOldCategories);
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
    const oldCategories = await downloadDatabaseCollection("categories");

    await deleteToolFromCategoriesTransaction(transaction, modifiedToolId);
    await setToolTransaction(transaction, modifiedToolId, toolName, toolPrice, toolUrl, selectedCategoriesIds, selectedSubcategoriesIds);
    
    selectedCategoriesIds.forEach(async (selectedCategoryId) => {
      const selectedOldCategories = findElementsById(oldCategories, selectedCategoryId);
      const newSubcategories = await addToolToSubcategories(selectedOldCategories, modifiedToolId, selectedSubcategoriesIds);
      updateSubcategoriesTransactions(transaction, selectedCategoryId, newSubcategories, selectedOldCategories);
      console.log(`Tool of ID ${modifiedToolId} updated in Firebase Firestore categories collection`);
    });
  }).then(() => {
    console.log("Transaction modifyToolAndSaveUrlToCategories() is successfully commited!");
  }).catch((error) => {
    console.error("Transaction failed! ", error);
  });
}

const getDeletedCategoriesDocumentsTransaction = async (transaction, categories) => {
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

  const oldCategoriesDocs = await getDeletedCategoriesDocumentsTransaction(transaction, categories);

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

const deleteDatabaseTool = (id) => {
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
    state.categoriesAndSubcategories = await downloadDatabaseCollection("categories");
  } else {
    const numberOfToolsRef = db.collection("tools").doc("#numberOfTools");
    await createToolAndSaveUrlToCategories(numberOfToolsRef, toolCategories, toolName, toolPrice, imageUrl, selectedSubcategories);
    state.categoriesAndSubcategories = await downloadDatabaseCollection("categories");
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

// SECTION: TODO: name?

const downloadCategoriesAndSubcategories = async () => {
  const categoriesAndSubcategories = await downloadDatabaseCollection("categories");
  return categoriesAndSubcategories;
}

// Theoretically better place is in app.js but it is used only from db.js -> here for now ( create/modify/deleteToolAndSaveUrlToCategories contains too much business logic)
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
