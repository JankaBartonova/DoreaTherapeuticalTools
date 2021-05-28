const searchNavigation = document.querySelector(".form-search");
const userInfo = document.querySelector(".user-info");
const navBarCategories = document.querySelector(".navBarCategories");
const navBarSubcategories = document.querySelector(".navBarSubcategories");
const cardContainer = document.querySelector(".cardContainer");
const subcategoriesSelectContainer = document.querySelector(".subcategories");
const toolSubcategories = document.querySelector(".toolSubcategories");
const signup = document.querySelector(".sign");
const popupSignup = document.querySelector(".popup-signup-wrapper");
const closeIconSignup = document.querySelector(".popup-signup-close");
const login = document.querySelector(".login");
const popupLogin = document.querySelector(".popup-login-wrapper");
const closeIconLogin = document.querySelector(".popup-login-close"); 


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

showAndHidePopup(signup, popupSignup, closeIconSignup);
showAndHidePopup(login, popupLogin, closeIconLogin);
findToolByNumber(searchNavigation)
uploadingToolToDatabase();
