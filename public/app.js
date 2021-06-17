let categoriesSelect = null;
let subcategoriesSelect = null;
let rememberedSubcategories = [];
let onDisplaySubnavigationClick = null;
let onDisplayToolsInSelectedSubcategory = null;
let onToolFormSubmit = null;
let onCreateToolButtonClick = null;
let onDisplayToolsInSelectedCategory = null;
let rememberedTools = [];

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

const displayToolsInSelectedCategory = (target, snapshot, user) => {
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

const registerToolsInSelectedCategory = (snapshot, domElement, user) => {
  domElement.removeEventListener("click", onDisplayToolsInSelectedCategory);
  onDisplayToolsInSelectedCategory = (e) => {
    console.log("on tools in selected category click");

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    displayToolsInSelectedCategory(e.target, snapshot, user);
  }
  domElement.addEventListener("click", onDisplayToolsInSelectedCategory);
  return rememberedTools;
}

displaySubnavigationClick = (target, snapshot, domElementSibling) => {
  const categoryIndex = target.dataset.index;
  const subcategories = snapshot.docs[categoryIndex].data().subcategories;
  const buttonsNavBar = document.querySelectorAll(".btnNavBar");

  toggleElement(target, buttonsNavBar);
  updateSubnavigationVisibility(domElementSibling, target, subcategories, categoryIndex);
}

const registerSubnavigationOnClick = (snapshot, domElement, domElementSibling) => {
  domElement.removeEventListener("click", onDisplaySubnavigationClick);
  onDisplaySubnavigationClick = (e) => {
    console.log("on display subnavigation click")
    
    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }
  
    displaySubnavigationClick(e.target, snapshot, domElementSibling);
  };      
  domElement.addEventListener("click", onDisplaySubnavigationClick);
  return snapshot;
}

displayToolsInSelectedSubcategory = (target, snapshot, user) => {
  const categoryIndex = target.dataset.categoryIndex;
  const subcategoryIndex = target.dataset.subcategoryIndex;
  const toolIds = snapshot.docs[categoryIndex].data().subcategories[subcategoryIndex].tools;

  rememberedTools = toolIds;

  updateToolsVisibility(toolIds, user);
}

const registerToolsInSelectedSubcategory = (snapshot, domElement, user) => {
  domElement.removeEventListener("click", onDisplayToolsInSelectedSubcategory);
  onDisplayToolsInSelectedSubcategory = (e) => {
    console.log("on tools in selected subcategory click")

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    displayToolsInSelectedSubcategory(e.target, snapshot, user);
  };
  domElement.addEventListener("click", onDisplayToolsInSelectedSubcategory);
  return rememberedTools;
}

const getMultiSelectItems = (responseCategories) => {
  const items = responseCategories.map((category) => {
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

const createMultiselectCategories = async (snapshot) => {

  const categories = await getCategoriesAndSubcategories(snapshot);
  const multiSelectItems = await getMultiSelectItems(categories);

  categoriesSelect = addCategoriesMultiselect(
    ".categories",
    "categoriesTags",
    multiSelectItems,
    [],
    (value) => loadMultiselectSubcategories(value, categories, subcategoriesSelectContainer)
  );
}

const displaySelectedTools = async (ids, user) => {
  const selectedTools = await getSelectedTools(ids);
  await showSelectedTools(selectedTools, user);
}

const uploadingToolToDatabase = async () => {
  const toolNameElement = document.getElementById("tool-name");
  const toolPriceElement = document.getElementById("tool-price");
  const select = document.getElementById("select");
  const form = document.getElementById("upload-form");

  let toolImage = null;
  let imgType = null;

  form.removeEventListener("submit", onToolFormSubmit);
  onToolFormSubmit = (e) => {
    console.log("on tool form submit");
    e.preventDefault();

    const tool = getTool(toolNameElement, toolPriceElement, toolImage, imgType);

    storeImageToDatabase({ tool });
    resetForm(form, categoriesSelect, subcategoriesSelect);
    
  };
  form.addEventListener("submit", onToolFormSubmit);

  // Start infinite image file picking handling loop.
  (async () => {
    while (true) {
      toolImage = await waitForImage(select);
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