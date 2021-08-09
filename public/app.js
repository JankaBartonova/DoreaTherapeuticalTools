"use strict";

let widgets = {
  categoriesSelect: null,
  subcategoriesSelect: null
};

let state = {
  categoriesAndSubcategories: [],
  subcategories: [],
  tools: [],
  authenticatedUser: null,
  categoryIndex: null,
  subcategoryIndex: null
};

let onDisplaySubnavigatiOnClick = null;
let onDisplayToolsInSelectedSubcategoryOnClick = null;
let onUploadToolToDatabaseOnSubmit = null;
let onCreateToolButtonClick = null;
let onDisplayToolsInSelectedCategoryOnClick = null;
let onFindToolById = null;

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

const getToolIds = (categoriesAndSubcategories, categoryIndex, subcategoryIndex) => {
  if (subcategoryIndex) {
    const toolIds = categoriesAndSubcategories[categoryIndex].subcategories[subcategoryIndex].tools;
    return toolIds;
  }

  if (categoryIndex) {
    const subcategories = categoriesAndSubcategories[categoryIndex].subcategories;
    const toolIdsArrays = subcategories.map((subcategory) => {
      return subcategory.tools;
    });
    const toolIdsSet = getToolIdsSet(toolIdsArrays);
    const toolIds = convertSetToArray(toolIdsSet);
    return toolIds;
  }
}

const displaySubnavigatiOnClick = (target, domElementSibling) => {
  console.log("displaySubnavigatiOnClick()");

  searchErrorContainer.innerHTML = "";

  state.categoryIndex = target.dataset.index;

  const subcategories = state.categoriesAndSubcategories[state.categoryIndex].subcategories;
  const buttonsNavBar = document.querySelectorAll(".btnNavBar");

  toggleElement(target, buttonsNavBar);
  updateSubnavigationVisibility(domElementSibling, target, subcategories, state.categoryIndex);
}

const registerSubnavigationOnClick = (domElement, domElementSibling) => {
  domElement.removeEventListener("click", onDisplaySubnavigatiOnClick);
  onDisplaySubnavigatiOnClick = (e) => {
    console.log("onDisplaySubnavigatiOnClick()")

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    displaySubnavigatiOnClick(e.target, domElementSibling);
  };
  domElement.addEventListener("click", onDisplaySubnavigatiOnClick);
}

const displayToolsInSelectedCategoryOnClick = async (target, user) => {
  console.log("displayToolsInSelectedCategoryOnClick()");

  searchErrorContainer.classList.add("d-none");

  state.categoryIndex = target.dataset.index;

  const toolIds = getToolIds(state.categoriesAndSubcategories, state.categoryIndex, null);
  state.tools = toolIds;

  await updateToolsVisibility(toolIds, user);
}

const registerToolsInSelectedCategoryOnClick = (domElement, user) => {
  domElement.removeEventListener("click", onDisplayToolsInSelectedCategoryOnClick);
  onDisplayToolsInSelectedCategoryOnClick = async (e) => {
    console.log("onDisplayToolsInSelectedCategoryOnClick()");

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    await displayToolsInSelectedCategoryOnClick(e.target, user);
  }
  domElement.addEventListener("click", onDisplayToolsInSelectedCategoryOnClick);
}

const displayToolsInSelectedSubcategoryOnClick = async (target, user) => {
  console.log("displayToolsInSelectedSubcategoryOnClick()");
  state.subcategoryIndex = target.dataset.subcategoryIndex;

  const toolIds = getToolIds(state.categoriesAndSubcategories, state.categoryIndex, state.subcategoryIndex);
  state.tools = toolIds;

  const buttonsSubNavBar = document.querySelectorAll(".btnSubNavBar");
  toggleElement(target, buttonsSubNavBar);

  await updateToolsVisibility(toolIds, user);
}

const registerToolsInSelectedSubcategoryOnClick = (domElement, user) => {
  domElement.removeEventListener("click", onDisplayToolsInSelectedSubcategoryOnClick);
  onDisplayToolsInSelectedSubcategoryOnClick = async (e) => {
    console.log("onDisplayToolsInSelectedSubcategoryOnClick()")

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    await displayToolsInSelectedSubcategoryOnClick(e.target, user);
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
  const categories = await getMultiSelectItems(state.categoriesAndSubcategories);
  widgets.categoriesSelect = addCategoriesMultiselect(categories, selectedCategories);
}

const createSubcategoriesSelect = async (selectedCategories, selectedSubcategories) => {
  const allSubcategories = await getAllSubcategories(state.categoriesAndSubcategories);

  state.subcategories = removeSubcategoriesOfRemovedCategories(selectedCategories, state.subcategories);

  const subcategories = await getMultiselectSubItems(selectedCategories, allSubcategories);
  widgets.subcategoriesSelect = addSubcategoriesMultiselect(subcategories, selectedSubcategories);
}

const addCategoriesMultiselect = (categories, selectedCategories) => {
  removeAllElements(categoriesSelectContainer);

  const multiselect = addMultiselect(
    ".categories",
    ".categoriesTags",
    categories,
    selectedCategories,
    (selectedCategories) => {
      createSubcategoriesSelect(selectedCategories, state.subcategories);
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
      state.subcategories = selectedSubcategories;
    }
  );
  return multiselect;
}

const getSelectedTools = async (ids) => {
  try {
    if (!ids || !ids.length) {
      return [];
    }

    const selectedTools = await downloadDatabaseTools(ids);
    return selectedTools;

  } catch (error) {
    console.log(error);
  }
}

const displaySelectedTools = async (ids, user) => {
  const selectedTools = await getSelectedTools(ids);
  if (selectedTools) {
    await showSelectedTools(selectedTools, user);
  }
}

const refreshTools = async () => {
  console.log("refreshTools()");

  state.categoriesAndSubcategories = await downloadCategoriesAndSubcategories();

  const toolIds = getToolIds(state.categoriesAndSubcategories, state.categoryIndex, state.subcategoryIndex);
  state.tools = toolIds;

  await updateToolsVisibility(toolIds, state.authenticatedUser);
}

const validateUserTool = (tool) => {
  console.log("ValidateUserTool()");

  if (!tool.name.length) {
    console.log("name is not chosen")
    showErrorMessage(nameErrorDisplay, "Jméno pomůcky není zadáno");
    return false;
  }
  if (!tool.price) {
    console.log("price is not chosen")
    showErrorMessage(priceErrorDisplay, "Orientační cena pomůcky není zadána");
    return false;
  }
  if (!tool.categories.length) {
    console.log("categories are not chosen")
    showErrorMessage(categoriesErrorDisplay, "Kategorie pomůcky nejsou zadány");
    return false;
  }
  if (!tool.subcategories.length) {
    console.log("subcategories are not chosen")
    showErrorMessage(subcategoriesErrorDisplay, "Podkategorie pomůcky nejsou zadány nebo podkategorie určité kategorie nejsou zadány");
    return false;
  }
  if (!tool.image) {
    console.log("image was not chosen")
    showErrorMessage(imageErrorDisplay, "Obrázek není vybrán. Pokud není k dispozici obrázek pomůcky, vyberte zástupný obrázek");
    return false;
  }

  return true;
}

const registerUploadToolToDatabaseOnSubmit = async (toolNameElement, toolPriceElement, selectElement, formElement) => {
  console.log("registerUploadToolToDatabaseOnSubmit()");

  formElement.removeEventListener("submit", onUploadToolToDatabaseOnSubmit);
  onUploadToolToDatabaseOnSubmit = async (e) => {
    console.log("onUploadToolToDatabaseOnSubmit()");
    e.preventDefault();

    const toolData = getToolDataFromUser(formElement, toolNameElement, toolPriceElement);
    const tool = setTool(toolData.name, toolData.price, toolImage.src);

    if (!validateUserTool(tool)) {
      return;
    };

    await storeToolToDatabase(tool, toolData.imageChanged, toolData.modifiedToolId);

    resetForm(formElement, toolData.modifiedToolId);
    await refreshTools();
  };
  formElement.addEventListener("submit", onUploadToolToDatabaseOnSubmit);

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
    console.log("registerDeleteToolOnClick()");
    const toolId = e.target.dataset.id;

    if (user) {
      await deleteDatabaseTool(toolId);
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

    const modifiedTool = await downloadDatabaseTools(toolIdArray);

    const categories = modifiedTool[0].categories;
    const subcategories = modifiedTool[0].subcategories;

    showAddToolForm(admin, form, 1, toolName, toolPrice, categories, subcategories, toolSelect, toolImage, user, modifiedTool[0]);
  });
}

const getToolIdFromUser = () => {
  const search = document.querySelector("#search");
  const toolId = search.value;
  return toolId;
};

const validateUserToolId = (toolId, domElement) => {
  const toolIdPattern = /^[0-9]+$/;
  if (toolId.toString().match(toolIdPattern)) {
    return true;
  } else {
    console.log(`The toolId ${toolId} is not a number`);
    showInputValidationError();
    domElement.reset();
    return false;
  }
}

const clearResult = (errorContainer, cardContainer) => {
  errorContainer.innerHTML = "";
  removeAllElements(cardContainer);
  errorContainer.classList.add("d-none");
}

const showTool = (tool, toolId) => {
  if (!tool) {
    console.log(`The tool ${toolId} does not exist in database`);
    showErrorToolDoesNotExist(toolId);
    return;
  }

  if (state.authenticatedUser) {
    addToolToDom(tool);
    displayAdminOptions(state.authenticatedUser);
  }
}

const registerFindToolById = (domElement) => {
  domElement.removeEventListener("submit", onFindToolById);
  onFindToolById = async (e) => {
    console.log("onFindToolById()");
    e.preventDefault();

    clearResult(searchErrorContainer, cardContainer);

    let toolId = getToolIdFromUser();
    const validatedId = validateUserToolId(toolId, domElement);
    toolId = parseInt(toolId);

    if (!validatedId) {
      return;
    }

    const tool = await downloadDatabaseTool(toolId);
    showTool(tool, toolId);

    domElement.reset();
  }
  domElement.addEventListener("submit", onFindToolById);
}

const getCategories = (categoriesAndSubcategories) => {
  const categories = categoriesAndSubcategories.map((category) => {
    return category.title;
  })
  return categories;
}

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

const getFileTypeFrom64Url = (url) => {
  const firstPosition = url.indexOf("/");
  const lastPosition = url.indexOf(";");
  const type = url.slice(firstPosition + 1, lastPosition);
  return type;
}

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

const setTool = (name, price, image) => {
  console.log("setTool()");

  const categoriesAndSubcategories = getMultiselectValues();
  const categories = categoriesAndSubcategories.categories;
  const subcategories = categoriesAndSubcategories.subcategories

  return {
    name: name,
    price: parseInt(price),
    categories: [...categories],
    subcategories: [...subcategories],
    image: image
  }
}

const getNewTools = (oldCategory, subcategories, deletedToolId) => {
  return oldCategory.subcategories.map((subcategory) => {
    if (subcategories.includes(subcategory.id)) {
      const tools = subcategory.tools.filter((tool) => {
        return tool != deletedToolId;
      })

      const newSubcategory = {
        ...subcategory,
        tools: tools
      }
      return newSubcategory;
    }
    return subcategory;
  })
}

const updateCategory = (oldCategory, subcategories, deletedToolId) => {
  const newTools = getNewTools(oldCategory, subcategories, deletedToolId, "0" + oldCategory.id);

  const newCategory = {
    ...oldCategory,
    subcategories: newTools
  }
  return newCategory;
}
