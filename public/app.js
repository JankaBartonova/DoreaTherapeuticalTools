"use strict";

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
let authenticatedUser = null;
let categoryIndexGlobal = null;
let subcategoryIndexGlobal = null;

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

const getToolIds = (snapshot, categoryIndex, subcategoryIndex) => {
  if (subcategoryIndex) {
    const toolIds = snapshot.docs[categoryIndex].data().subcategories[subcategoryIndex].tools;
    return toolIds;
  } else {
    const subcategories = snapshot.docs[categoryIndex].data().subcategories;
    const toolIdsArrays = subcategories.map((subcategory) => {
      return subcategory.tools;
    });
    const toolIdsSet = getToolIdsSet(toolIdsArrays);
    const toolIds = convertSetToArray(toolIdsSet);
    return toolIds;
  }
}

const displayToolsInSelectedCategoryOnClick = async (target, snapshot, user) => {
  console.log("displayToolsInSelectedCategoryOnClick()");

  categoryIndexGlobal = target.dataset.index;
  const toolIds = getToolIds(snapshot, categoryIndexGlobal, null);

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
}

const displaySubnavigatiOnClick = (target, snapshot, domElementSibling) => {
  console.log("displaySubnavigatiOnClick()");
  categoryIndexGlobal = target.dataset.index;

  const subcategories = snapshot.docs[categoryIndexGlobal].data().subcategories;
  const buttonsNavBar = document.querySelectorAll(".btnNavBar");

  toggleElement(target, buttonsNavBar);
  updateSubnavigationVisibility(domElementSibling, target, subcategories, categoryIndexGlobal);
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
  console.log("displayToolsInSelectedSubcategoryOnClick()");
  subcategoryIndexGlobal = target.dataset.subcategoryIndex;

  const toolIds = getToolIds(snapshot, categoryIndexGlobal, subcategoryIndexGlobal);
  rememberedTools = toolIds;

  const buttonsSubNavBar = document.querySelectorAll(".btnSubNavBar");
  toggleElement(target, buttonsSubNavBar);

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

const getAllSubcategories = (categories) => {
  const items = categories.map((category) => {
    const subcategories = category.subcategories;
    return subcategories;
  })
  return items;
}

const removeSubcategoriesOfRemovedCategories = (selectedCategories, rememberedSubcategories) => {
  const subcategories = rememberedSubcategories.filter((rememberedSubcategory) => {
    const categoryId = rememberedSubcategory.charAt(0);
    const category = selectedCategories.find((selectedCategory) => {
      return selectedCategory == categoryId;
    });
    return category !== undefined;
  });
  return subcategories;
}

const createCategoriesSelect = async (selectedCategories) => {
  const categories = await getMultiSelectItems(categoriesAndSubcategories);
  categoriesSelect = addCategoriesMultiselect(categories, selectedCategories);
}

const createSubcategoriesSelect = async (selectedCategories, selectedSubcategories) => {
  const allSubcategories = await getAllSubcategories(categoriesAndSubcategories);

  rememberedSubcategories = removeSubcategoriesOfRemovedCategories(selectedCategories, rememberedSubcategories);

  const subcategories = await getMultiselectSubItems(selectedCategories, allSubcategories);
  subcategoriesSelect = addSubcategoriesMultiselect(subcategories, selectedSubcategories);
}

const addCategoriesMultiselect = (categories, selectedCategories) => {
  removeAllElements(categoriesSelectContainer);

  const multiselect = addMultiselect(
    ".categories",
    ".categoriesTags",
    categories,
    selectedCategories,
    (selectedCategories) => {
      createSubcategoriesSelect(selectedCategories, rememberedSubcategories);
    }
  );
  return multiselect;
}

const addSubcategoriesMultiselect = (subcategories, selectedSubcategories) => {
  removeAllElements(subcategoriesSelectContainer);

  const multiselect = addMultiselect(
    ".subcategories",
    ".subcategoriesTags",
    subcategories,
    selectedSubcategories,
    (selectedSubcategories) => {
      rememberedSubcategories = selectedSubcategories;
    }
  );
  return multiselect;
}

const displaySelectedTools = async (ids, user) => {
  const selectedTools = await getSelectedTools(ids);
  await showSelectedTools(selectedTools, user);
}

const refreshTools = async () => {
  console.log("refreshTools()");
  const snapshot = await getDatabaseCategoriesAndSubcategories("categories");
  getCategoriesAndSubcategories(snapshot);
  const toolIds = getToolIds(snapshot, categoryIndexGlobal, subcategoryIndexGlobal);

  rememberedTools = toolIds;

  await updateToolsVisibility(toolIds, authenticatedUser);
}

const uploadingToolToDatabase = async (toolNameElement, toolPriceElement, selectElement, formElement) => {
  console.log("uploadingToolToDatabase()");

  formElement.removeEventListener("submit", onToolFormSubmit);
  onToolFormSubmit = async (e) => {
    console.log("onToolFormSubmit()");
    e.preventDefault();

    const modifiedToolId = parseInt(formElement.dataset.toolid) || -1;
    const imageChanged = convertStringToBoolean(selectedImage.value);

    const tool = getTool(toolNameElement, toolPriceElement, toolImage.src);
    await storeToolToDatabase(tool, imageChanged, modifiedToolId);
    
    resetForm(formElement, modifiedToolId);
    await refreshTools();
  };
  formElement.addEventListener("submit", onToolFormSubmit);

  // Start infinite image file picking handling loop.
  (async () => {
    while (true) {
      await waitForImage(selectElement);
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
  domElement.addEventListener("click", async (e) => {
    console.log("On delete tool click");
    const toolId = e.target.dataset.id;

    if (user) {
      await deleteToolDatabase(toolId);
    }

    await refreshTools();    
  });
}

const registerModifyToolOnClick = (domElement, user) => {
  domElement.addEventListener("click", async (e) => {
    console.log("registerModifyToolOnClick()");
    const toolId = e.target.dataset.id;
    const toolIdArray = [];
    toolIdArray.push(parseInt(toolId));

    const modifiedTool = await downloadToolsFromDatabase(toolIdArray);

    const categories = modifiedTool[0].categories;
    const subcategories = modifiedTool[0].subcategories;

    showAddToolForm(admin, form, 1, toolName, toolPrice, categories, subcategories, select, toolImage, user, modifiedTool[0]);
  });
}
