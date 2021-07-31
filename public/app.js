let categoriesSelect = null;
let subcategoriesSelect = null;
let rememberedSubcategories = [];
let onDisplaySubnavigatiOnClick = null;
let onDisplayToolsInSelectedSubcategoryOnClick = null;
let onToolFormSubmit = null;
let onCreateToolButtonClick = null;
let onDisplayToolsInSelectedCategoryOnClick = null;
let rememberedTools = [];
let categoriesAndSubcategories = [];

const addCategoriesToNavbar = (categories) => {
  categories.forEach((category, index) => {
    addNavBar(navBarCategories, category, index);
  });
}

const getToolIdsSet = (toolIdsArrays) => {
  let toolIdsSet = new Set();
  toolIdsArrays.forEach((toolIdsArray) => {
    if (toolIdsArray) {
      toolIdsArray.forEach((toolId) => {
        toolIdsSet.add(toolId);
      });
    }
  });
  return toolIdsSet;
}

const displayToolsInSelectedCategoryOnClick = async (target, snapshot, user) => {
  console.log("displayToolsInSelectedCategoryOnClick()");

  const categoryIndex = target.dataset.index;
  const subcategories = snapshot.docs[categoryIndex].data().subcategories;
  const toolIdsArrays = subcategories.map((subcategory) => {
    return subcategory.tools;
  });
  const toolIdsSet = getToolIdsSet(toolIdsArrays);
  const toolIds = convertSetToArray(toolIdsSet);

  rememberedTools = toolIds;

  await updateToolsVisibility(toolIds, user);
}

const registerToolsInSelectedCategoryOnClick = (snapshot, domElement, user) => {
  domElement.removeEventListener("click", onDisplayToolsInSelectedCategoryOnClick);
  onDisplayToolsInSelectedCategoryOnClick = async (e) => {
    console.log("onDisplayToolsInSelectedCategoryOnClick()");

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    await displayToolsInSelectedCategoryOnClick(e.target, snapshot, user);
  }
  domElement.addEventListener("click", onDisplayToolsInSelectedCategoryOnClick);
  return rememberedTools;
}

const displaySubnavigatiOnClick = (target, snapshot, domElementSibling) => {
  console.log("displaySubnavigatiOnClick()");

  const categoryIndex = target.dataset.index;
  const subcategories = snapshot.docs[categoryIndex].data().subcategories;
  const buttonsNavBar = document.querySelectorAll(".btnNavBar");

  toggleElement(target, buttonsNavBar);
  updateSubnavigationVisibility(domElementSibling, target, subcategories, categoryIndex);
}

const registerSubnavigationOnClick = (snapshot, domElement, domElementSibling) => {
  domElement.removeEventListener("click", onDisplaySubnavigatiOnClick);
  onDisplaySubnavigatiOnClick = (e) => {
    console.log("onDisplaySubnavigatiOnClick()")

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    displaySubnavigatiOnClick(e.target, snapshot, domElementSibling);
  };
  domElement.addEventListener("click", onDisplaySubnavigatiOnClick);
  return snapshot;
}

const displayToolsInSelectedSubcategoryOnClick = async (target, snapshot, user) => {
  const categoryIndex = target.dataset.categoryIndex;
  const subcategoryIndex = target.dataset.subcategoryIndex;
  const toolIds = snapshot.docs[categoryIndex].data().subcategories[subcategoryIndex].tools;

  rememberedTools = toolIds;

  await updateToolsVisibility(toolIds, user);
}

const registerToolsInSelectedSubcategoryOnClick = (snapshot, domElement, user) => {
  domElement.removeEventListener("click", onDisplayToolsInSelectedSubcategoryOnClick);
  onDisplayToolsInSelectedSubcategoryOnClick = async (e) => {
    console.log("onDisplayToolsInSelectedSubcategoryOnClick()")

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    await displayToolsInSelectedSubcategoryOnClick(e.target, snapshot, user);
  };
  domElement.addEventListener("click", onDisplayToolsInSelectedSubcategoryOnClick);
  return rememberedTools;
}

const getMultiSelectItems = (categoriesAndSubcategories) => {
  const items = categoriesAndSubcategories.map((category) => {
    const label = category.title;

    return {
      label: label,
      value: category.id.toString(),
    }
  });
  return items;
}

const getSubcategories = (categories) => {
  const items = categories.map((category) => {
    const subcategories = category.subcategories;
    return subcategories;
  });
  return items;
}

const createMultiselectSubcategoriesInstance = (multiselectSubItems, subcategoriesSelectContainer, values) => {
  removeAllElements(subcategoriesSelectContainer);

  // if category is empty, do not show subcategories
  // if (values.length == 0) {
  //   return;
  // }

  // if category empty drop remebered subcategories
  if (values.length == 0) {
    rememberedSubcategories = [];
  }

  console.log("RememberedSubcategories: ", rememberedSubcategories);
  categoriesSelect = addCategoriesMultiselect(
    ".subcategories",
    "subcategoriesTags",
    multiselectSubItems,
    rememberedSubcategories,
    (values) => {
      console.log("subitem changed")
      rememberedSubcategories = values;
    }
  );
}

const createMultiselectSubcategories = async (categoriesAndSubcategories, subcategoriesSelectContainer, values) => {
  console.log("createMultiselectSubcategories()")

  console.log(categoriesAndSubcategories)
  console.log(values)
  const multiselectSubcategories = await getSubcategories(categoriesAndSubcategories);
  console.log(multiselectSubcategories)
  const multiselectSubItems = await getMultiselectSubItems(values, multiselectSubcategories);
  createMultiselectSubcategoriesInstance(multiselectSubItems, subcategoriesSelectContainer, values);
}

const createMultiselectCategoriesInstance = (domClass, domClassTag, items, categoriesAndSubcategories, subcategoriesSelectContainer, values) => {
  if (domClass == ".categories") {
    categoriesSelect = addCategoriesMultiselect(
      domClass,
      domClassTag,
      items,
      values,
      (value) => {
        console.log(value)
        createMultiselectSubcategories(categoriesAndSubcategories, subcategoriesSelectContainer, value);
      }
    );
  } else {
    subcategoriesSelect = addCategoriesMultiselect(
      domClass,
      domClassTag,
      items,
      values,
      (value) => {
        console.log(value)
        value = extractCategories(value);
        console.log(value)
        createMultiselectSubcategories(categoriesAndSubcategories, subcategoriesSelectContainer, value);
      }
    );
  }
}

const createMultiselectCategories = async (domClass, domClassTag, categoriesAndSubcategories, values) => {
  if (domClass == ".categories") {
    const multiSelectItems = await getMultiSelectItems(categoriesAndSubcategories);
    createMultiselectCategoriesInstance(domClass, domClassTag, multiSelectItems, categoriesAndSubcategories, subcategoriesSelectContainer, values);
  } else {
    const multiselectSubItems = await getMultiselectSubItems(values, categoriesAndSubcategories);
    createMultiselectCategoriesInstance(domClass, domClassTag, multiselectSubItems, categoriesAndSubcategories, subcategoriesSelectContainer, values);
  }
}

const displaySelectedTools = async (ids, user) => {
  const selectedTools = await getSelectedTools(ids);
  await showSelectedTools(selectedTools, user);
}

const uploadingToolToDatabase = async (toolNameElement, toolPriceElement, selectElement, formElement) => {
  console.log("uploadingToolToDatabase()");

  let toolImage = null;
  let imgType = null;

  formElement.removeEventListener("submit", onToolFormSubmit);
  onToolFormSubmit = (e) => {
    console.log("onToolFormSubmit()");
    e.preventDefault();

    const modifiedToolId = parseInt(formElement.dataset.toolid);

    if (modifiedToolId) {
      // Get tool from user
      const toolImage = document.querySelector(".tool-image").src;
      const tool = getTool(toolNameElement, toolPriceElement, toolImage);
      console.log(tool);

      // was image selected?
      const imageChanged = convertStringToBoolean(selectedImage.value);
      console.log(imageChanged, typeof(imageChanged));

      // Change info info in database Tools collection, Compare with info in database Categories collection, Change info in database Categories collection
      storeToolToDatabase({ tool }, imageChanged, modifiedToolId); 

    } else {
      console.log("new tool");
      const tool = getTool(toolNameElement, toolPriceElement, toolImage);
      console.log(tool)
      console.log(selectedImage.value);
      storeToolToDatabase({ tool }, selectedImage.value); 
    }

    resetForm(formElement, modifiedToolId);
  };
  formElement.addEventListener("submit", onToolFormSubmit);

  // Start infinite image file picking handling loop.
  (async () => {
    while (true) {
      toolImage = await waitForImage(selectElement);
      imgType = getFileTypeFrom64Url(toolImage);
    }
  })();
}

const waitForImage = async (select) => {
  await waitForClick(select);

  const image = await handleImageSelect()
  if (!image) {
    console.error("Can not load image!");
  }

  return image;
}

const handleImageSelect = async () => {
  try {
    const selectedFile = await pickFile();
    const loadedImg = await loadFile(selectedFile);
    selectedImage.value = true;
    showImage(loadedImg);

    if (loadedImg) {
      return loadedImg;
    }
  } catch (e) {
    console.log(e);
    return null;
  }
}

const registerDeleteToolOnClick = (domElement, user) => {
  domElement.addEventListener("click", (e) => {
    console.log("On delete tool click");
    toolId = e.target.dataset.id;

    if (user) {
      deleteToolDatabase(toolId);
    }
  });
}

const registerModifyToolOnClick = (domElement, user) => {
  domElement.addEventListener("click", async (e) => {
    console.log("on modify tool button click");
    toolId = e.target.dataset.id;
    toolIdArray = [];
    toolIdArray.push(parseInt(toolId));

    const modifiedTool = await downloadToolsFromDatabase(toolIdArray);

    categories = modifiedTool[0].categories;
    subcategories = modifiedTool[0].subcategories;

    showAddToolForm(admin, form, 1, toolName, toolPrice, categories, subcategories, select, toolImage, user, modifiedTool[0]);
  });
}
