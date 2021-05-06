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

const setNewTool = (count, name, price, url) => {
  const toolsRef = db.collection("tools").doc(`${count}`);
  toolsRef.set({
    id: count,
    name: name,
    image: url,
    price: price
  }, { merge: true });
  console.log("New tool saved to Firebase Firestore tool collection.");
}

const uploadImageUrlToDatabase = (storageRef, toolName, toolPrice, toolCategories, toolSubcategories) => {
  storageRef
    .getDownloadURL()
    .then((url) => {

      toolCategory = `0${toolCategories}`;
      console.log(toolCategory)
      // ["1:1", "1:2"]
      console.log(toolSubcategories)

      const numberOfToolsRef = db.collection("tools").doc("numberOfTools");
      const categoryRef = db.collection("categories").doc(`${toolCategory}`);

      return db.runTransaction((transaction) => {
        return transaction
          .get(numberOfToolsRef)
          .then(async (numberOfToolsDoc) => {
            const oldCategory = await transaction
              .get(categoryRef)
              .then((categoryDoc) => {
                console.log(categoryDoc.data());
                return categoryDoc.data();
              })

            const newCount = numberOfToolsDoc.data().count + 1;
            // setNewTool se vykoná, ikdyž transaction fail, proč?
            setNewTool(newCount, toolName, toolPrice, url);
            transaction.update(numberOfToolsRef, { count: newCount });

            console.log(oldCategory.subcategories)
            
            const newCategory = oldCategory.subcategories.forEach((subcategory, index) => {
              console.log(subcategory, subcategory.id, index)

              if (toolSubcategories.includes(subcategory.id)) {

                const toolStore = [...oldCategory.subcategories[index].tools, newCount];
                const idStored = oldCategory.subcategories[index].id
                const titleStored = oldCategory.subcategories[index].title;
                console.log(toolStore, idStored, titleStored)

                const newCategory = {
                  id: oldCategory.id,
                  title: oldCategory.title,
                  subcategories: [
                    {
                      id: idStored,
                      title: titleStored,
                      tools: toolStore
                    }
                  ]
                }
                // transaction.update(categoryRef, newCategory);
              }
            })
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
      uploadImageUrlToDatabase(storageRef, tool.name, parseInt(tool.price), [...tool.categories], toolSubcategories);
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
