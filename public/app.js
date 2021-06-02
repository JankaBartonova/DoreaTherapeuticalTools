let categoriesSelect = null;
let subcategoriesSelect = null;
let remeberedSubcategories = [];

const getCategoriesAndSubcategories = (snapshot) => {
  const categoriesAndSubcategories = new Array();
  
  snapshot.docs.forEach((doc) => {
    categoriesAndSubcategories.push(doc.data());
  });
  return categoriesAndSubcategories;
}

const getCategories = async (snapshot) => {
  const categoriesAndSubcategories = await getCategoriesAndSubcategories(snapshot);
  const categories = categoriesAndSubcategories.map((category) => {
    return category.title;
  })
  return categories;
}

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
  
    const buttonsNavBar = document.querySelectorAll(".btnNavBar");
    toggleElement(e.target, buttonsNavBar);
    displayAndHideSubnavigation(domElementSibling, e.target, snapshot);      
    });
    return snapshot;
}

const displayToolsInSelectedSubcategory = (snapshot, domElement, user) => {
  domElement.addEventListener("click", (e) => {

    // avoid event listener on container
    if (e.target == domElement) {
      return false;
    }

    displayAndHideTools(e.target, snapshot, user);
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

const loadMultiselectCategories = async (snapshot) => {
      
  const categories = await getCategoriesAndSubcategories(snapshot);
  const multiSelectItems = await getMultiSelectItems(categories);

  categoriesSelect = addMultiselectCategories(
    ".categories",
    "categoriesTags",
    multiSelectItems,
    [],
    (value) => loadMultiselectSubcategories(value, categories, subcategoriesSelectContainer)
  );
}

const displaySelectedCards = async (ids, user) => {
  const selectedCards = await getSelectedCards(ids);
  console.log(selectedCards);
  await showSelectedCards(selectedCards, user);
}
