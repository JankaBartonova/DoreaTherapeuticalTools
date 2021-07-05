let categoriesSelect = null;
let subcategoriesSelect = null;
let rememberedSubcategories = [];
let onDisplaySubnavigatiOnClick = null;
let onDisplayToolsInSelectedSubcategoryOnClick = null;
let onToolFormSubmit = null;
let onCreateToolButtonClick = null;
let onDisplayToolsInSelectedCategory = null;
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

const displayToolsInSelectedCategoryOnClick = (target, snapshot, user) => {
  const categoryIndex = target.dataset.index;
  const subcategories = snapshot.docs[categoryIndex].data().subcategories;
  const toolIdsArrays = subcategories.map((subcategory) => {
    return subcategory.tools;
  });
  const toolIdsSet = getToolIdsSet(toolIdsArrays);
  const toolIds = convertSetToArray(toolIdsSet);;

  rememberedTools = toolIds;

  updateToolsVisibility(toolIds, user);
}

const registerToolsInSelectedCategoryOnClick = (snapshot, domElement, user) => {
  domElement.removeEventListener("click", onDisplayToolsInSelectedCategory);
  onDisplayToolsInSelectedCategory = (e) => {
    console.log("on tools in selected category click");

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    displayToolsInSelectedCategoryOnClick(e.target, snapshot, user);
  }
  domElement.addEventListener("click", onDisplayToolsInSelectedCategory);
  return rememberedTools;
}

const displaySubnavigatiOnClick = (target, snapshot, domElementSibling) => {
  const categoryIndex = target.dataset.index;
  const subcategories = snapshot.docs[categoryIndex].data().subcategories;
  const buttonsNavBar = document.querySelectorAll(".btnNavBar");

  toggleElement(target, buttonsNavBar);
  updateSubnavigationVisibility(domElementSibling, target, subcategories, categoryIndex);
}

const registerSubnavigationOnClick = (snapshot, domElement, domElementSibling) => {
  domElement.removeEventListener("click", onDisplaySubnavigatiOnClick);
  onDisplaySubnavigatiOnClick = (e) => {
    console.log("on display subnavigation click")

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    displaySubnavigatiOnClick(e.target, snapshot, domElementSibling);
  };
  domElement.addEventListener("click", onDisplaySubnavigatiOnClick);
  return snapshot;
}

const displayToolsInSelectedSubcategoryOnClick = (target, snapshot, user) => {
  const categoryIndex = target.dataset.categoryIndex;
  const subcategoryIndex = target.dataset.subcategoryIndex;
  const toolIds = snapshot.docs[categoryIndex].data().subcategories[subcategoryIndex].tools;

  rememberedTools = toolIds;

  updateToolsVisibility(toolIds, user);
}

const registerToolsInSelectedSubcategoryOnClick = (snapshot, domElement, user) => {
  domElement.removeEventListener("click", onDisplayToolsInSelectedSubcategoryOnClick);
  onDisplayToolsInSelectedSubcategoryOnClick = (e) => {
    console.log("on tools in selected subcategory click")

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    displayToolsInSelectedSubcategoryOnClick(e.target, snapshot, user);
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
    const subcategories = category.subcategories
    return subcategories;
  });
  return items;
}

const createMultiselectSubcategoriesInstance = (multiselectSubItems, categoriesAndSubcategories, subcategoriesSelectContainer, values) => {
  console.log("values: ", values)
  console.log("subcategoriesSelectContainer: ", subcategoriesSelectContainer)

  removeAllElements(subcategoriesSelectContainer);

  // if category is empty, do not show subcategories
  if (values.length == 0) {
    return;
  }

  categoriesSelect = addCategoriesMultiselect(
    ".subcategories",
    "subcategoriesTags",
    multiselectSubItems,
    rememberedSubcategories,
    (values) => {
      rememberedSubcategories = values;
      console.log(rememberedSubcategories);
    }
  );
} 

const createMultiselectSubcategories = async (categoriesAndSubcategories, values) => {
  const multiselectSubcategories = await getSubcategories(categoriesAndSubcategories);
  console.log(multiselectSubcategories);
  const multiselectSubItems = await getMultiselectSubItems(values, multiselectSubcategories);
  console.log(multiselectSubItems)

  createMultiselectSubcategoriesInstance(multiselectSubItems, categoriesAndSubcategories, subcategoriesSelectContainer, values);
}

const createMultiselectCategoriesInstance = (domClass, domClassTag, multiSelectItems, categoriesAndSubcategories, subcategoriesSelectContainer, values) => {
  console.log("values: ", values)
  console.log("multiselectItems: ", multiSelectItems);
  
  categoriesSelect = addCategoriesMultiselect(
    domClass,
    domClassTag,
    multiSelectItems,
    values,
    (value) => {
      console.log("value inside callback: ", value);
      createMultiselectSubcategories(categoriesAndSubcategories, value);
    }
  );
}

const createMultiselectCategories = async (domClass, domClassTag, categoriesAndSubcategories, values) => {
  console.log(values)

  // check if subcategories
  if (values.length && values[0].includes(":")) {
    console.log("these are subcategories");
    const multiselectSubItems = await getMultiselectSubItems(values, categoriesAndSubcategories);
    console.log(multiselectSubItems)

    createMultiselectCategoriesInstance(domClass, domClassTag, multiselectSubItems, categoriesAndSubcategories, subcategoriesSelectContainer, values);

  } 
    const multiSelectItems = await getMultiSelectItems(categoriesAndSubcategories);

    createMultiselectCategoriesInstance(domClass, domClassTag, multiSelectItems, categoriesAndSubcategories, subcategoriesSelectContainer, values);

}

const displaySelectedTools = async (ids, user) => {
  const selectedTools = await getSelectedTools(ids);
  await showSelectedTools(selectedTools, user);
}

const uploadingToolToDatabase = async (toolNameElement, toolPriceElement, selectElement, formElement) => {

  let toolImage = null;
  let imgType = null;

  formElement.removeEventListener("submit", onToolFormSubmit);
  onToolFormSubmit = (e) => {
    console.log("on tool form submit");
    e.preventDefault();

    const tool = getTool(toolNameElement, toolPriceElement, toolImage, imgType);

    storeImageToDatabase({ tool });
    resetForm(formElement, categoriesSelect, subcategoriesSelect);
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

const addRemeberedMultiselect = (databaseCategories, categories) => {
  console.log("databaseCategories", databaseCategories)
  console.log("categories", categories)

  const filteredCategories = databaseCategories.filter((databaseCategory) => {
    return categories.find((category) => {
      return category == databaseCategory.id;
    });
  });
  console.log("filteredCategories: ", filteredCategories)

  const multiSelectItems = getMultiSelectItems(filteredCategories);
  console.log(multiSelectItems);
}

const registerModifyToolOnClick = (domElement, user) => {
  domElement.addEventListener("click", async (e) => {
    console.log("On modify tool button click");
    toolId = e.target.dataset.id;
    toolIdArray = [];
    toolIdArray.push(parseInt(toolId));

    const modifiedTool = await downloadToolsFromDatabase(toolIdArray);
    // console.log(modifiedTool);

    categories = modifiedTool[0].categories;
    subcategories = modifiedTool[0].subcategories;
    // console.log("Categories: ", categories);
    // console.log("Subcategories: ", subcategories);    
    
    //const databaseCategoriesAndSubcategories = await getFirebaseCollection("categories");
    //addRemeberedMultiselect(databaseCategoriesAndSubcategories, categories);

    showAddToolForm(admin, form, 1, toolName, toolPrice, categories, subcategories, select, toolImage, user, modifiedTool[0]);
  });
}