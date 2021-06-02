let categoriesSelect = null;
let subcategoriesSelect = null;
let remeberedSubcategories = [];

const addCategoriesToNavbar = (categories) => {
  categories.forEach((category, index) => {
    addNavBar(navBarCategories, category, index);
  });
}

const displaySubnavigationOnClick = (snapshot, domElement, domElementSibling) => {
  domElement.addEventListener("click", (e) => {
    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    const categoryIndex = e.target.dataset.index;
    const subcategories = snapshot.docs[categoryIndex].data().subcategories;
    const buttonsNavBar = document.querySelectorAll(".btnNavBar");

    toggleElement(e.target, buttonsNavBar);
    updateSubnavigationVisibility(domElementSibling, e.target, subcategories, categoryIndex);
  });
  return snapshot;
}

const displayToolsInSelectedSubcategory = (snapshot, domElement) => {
  domElement.addEventListener("click", (e) => {

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    const categoryIndex = e.target.dataset.categoryIndex;
    const subcategoryIndex = e.target.dataset.subcategoryIndex;
    const toolIds = snapshot.docs[categoryIndex].data().subcategories[subcategoryIndex].tools;

    updateToolsVisibility(toolIds);
  });
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

const displaySelectedCards = async (ids) => {
  const selectedCards = await getSelectedTools(ids);
  await showSelectedCards(selectedCards);
}

const uploadingToolToDatabase = async () => {
  const toolNameElement = document.getElementById("tool-name");
  const toolPriceElement = document.getElementById("tool-price");
  const select = document.getElementById("select");
  const form = document.getElementById("upload-form");

  let toolImage = null;
  let imgType = null;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const tool = getTool(toolNameElement, toolPriceElement, toolImage, imgType);

    storeImageToDatabase({ tool });
    resetForm(form, categoriesSelect, subcategoriesSelect);
  });

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