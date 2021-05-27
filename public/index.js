const searchNavigation = document.querySelector(".form-search");
const userInfo = document.querySelector(".user-info");
const navBarCategories = document.querySelector(".navBarCategories");
const navBarSubcategories = document.querySelector(".navBarSubcategories");
const cardContainer = document.querySelector(".cardContainer");
const subcategoriesSelectContainer = document.querySelector(".subcategories");
const toolSubcategories = document.querySelector(".toolSubcategories");
const sign = document.querySelector(".sign");
const popupSign = document.querySelector(".popup-sign-wrapper");
const closeIconSign = document.querySelector(".popup-sign-close");


(async () => {
  try {
    const snapshot = await getDatabaseCategoriesAndSubcategories("categories");
    const categories = await getCategories(snapshot);
    addCategoriesToNavbar(categories);
    displaySubnavigationOnClick(snapshot, navBarCategories, navBarSubcategories);
    displayToolsInSelectedSubcategory(snapshot, navBarSubcategories);
    loadMultiselectCategories(snapshot);

  } catch (error) {
    console.log(error);
  }
})();

showAndHidePopup(sign, popupSign, closeIconSign);

findToolByNumber(searchNavigation)
uploadingToolToDatabase();
