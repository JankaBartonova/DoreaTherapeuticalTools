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

const uploadImageUrlToFirestore = (storageRef) => {
  storageRef
    .getDownloadURL()
    .then((url) => {
      // TODO reference document (for now hardcoded .doc(1))
      const tools = db.collection("tools").doc("3");

      tools.set({
        image: url
      }, { merge: true });

      console.log("Image URL was added to Firebase Firestore!");
    })
}
