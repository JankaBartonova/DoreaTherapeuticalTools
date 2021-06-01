const searchForm = document.querySelector(".form-search");
const navBarCategories = document.querySelector(".navbar-categories");
const navBarSubcategories = document.querySelector(".navbar-subcategories");
const cardContainer = document.querySelector(".card-container");
const subcategoriesSelectContainer = document.querySelector(".subcategories");
const toolSubcategories = document.querySelector(".tool-subcategories");

(async () => {
  try {
    const snapshot = await getDatabaseCategoriesAndSubcategories("categories");
    const categories = getCategories(snapshot);
    addCategoriesToNavbar(categories);
    displaySubnavigationOnClick(snapshot, navBarCategories, navBarSubcategories);
    displayToolsInSelectedSubcategory(snapshot, navBarSubcategories);
    createMultiselectCategories(snapshot);
  } catch (error) {
    console.log(error);
  }
})();

uploadingToolToDatabase();
