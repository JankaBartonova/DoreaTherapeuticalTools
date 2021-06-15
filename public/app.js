let categoriesSelect = null;
let subcategoriesSelect = null;
let rememberedSubcategories = [];
let onDisplaySubnavigationClick = null;
let onDisplayToolsInSelectedSubactegory = null;
let onToolFormSubmit = null;
let onCreateToolButtonClick = null;

const addCategoriesToNavbar = (categories) => {
  categories.forEach((category, index) => {
    addNavBar(navBarCategories, category, index);
  });
}

const registerSubnavigationOnClick = (snapshot, domElement, domElementSibling) => {
  domElement.removeEventListener("click", onDisplaySubnavigationClick);
  onDisplaySubnavigationClick = (e) => {
    console.log("on display subnavigation click")
    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }
  
    const categoryIndex = e.target.dataset.index;
    const subcategories = snapshot.docs[categoryIndex].data().subcategories;
    const buttonsNavBar = document.querySelectorAll(".btnNavBar");
  
    toggleElement(e.target, buttonsNavBar);
    updateSubnavigationVisibility(domElementSibling, e.target, subcategories, categoryIndex);
  };      
  domElement.addEventListener("click", onDisplaySubnavigationClick);
  return snapshot;
}

const registerToolsInSelectedSubcategory = (snapshot, domElement, user) => {
  domElement.removeEventListener("click", onDisplayToolsInSelectedSubactegory);
  onDisplayToolsInSelectedSubactegory = (e) => {
    console.log("on tools in selected subcategory click")

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    const categoryIndex = e.target.dataset.categoryIndex;
    const subcategoryIndex = e.target.dataset.subcategoryIndex;
    const toolIds = snapshot.docs[categoryIndex].data().subcategories[subcategoryIndex].tools;

    updateToolsVisibility(toolIds, user);
  };
  domElement.addEventListener("click", onDisplayToolsInSelectedSubactegory);
  return snapshot;
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