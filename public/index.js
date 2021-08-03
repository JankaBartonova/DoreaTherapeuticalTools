"use strict";

const searchForm = document.querySelector(".form-search");
const navBarCategories = document.querySelector(".navbar-categories");
const navBarSubcategories = document.querySelector(".navbar-subcategories");
const cardContainer = document.querySelector(".card-container");
const categoriesSelectContainer = document.querySelector(".categories");
const subcategoriesSelectContainer = document.querySelector(".subcategories");
const toolCategories = document.querySelector(".tool-categories");
const toolSubcategories = document.querySelector(".tool-subcategories");
const signup = document.querySelector(".sign");
const popupSignup = document.querySelector(".popup-signup-wrapper");
const closeIconSignup = document.querySelector(".popup-signup-close");
const popupLogin = document.querySelector(".popup-login-wrapper");
const closeIconLogin = document.querySelector(".popup-login-close");
const loggedInLinks = document.querySelectorAll(".logged-in");
const loggedOutLinks = document.querySelectorAll(".logged-out");
const admin = document.querySelector(".popup-admin-wrapper");
const toolName = document.getElementById("tool-name");
const toolPrice = document.getElementById("tool-price");
const select = document.getElementById("select");
const form = document.getElementById("upload-form");
const toolImage = document.querySelector(".tool-image");
const selectedImage = document.getElementById("selected-image");
const searchContainer = document.querySelector("#navbar-search");
const searchErrorContainer = document.querySelector("#search-error-display");

(async () => {
  try {
    console.log("index.js")

    const snapshot = await getDatabaseCategoriesAndSubcategories("categories");
    categoriesAndSubcategories = getCategoriesAndSubcategories(snapshot);
    const categories = getCategories(snapshot);
    addCategoriesToNavbar(categories);
    registerSubnavigationOnClick(snapshot, navBarCategories, navBarSubcategories);
    
    auth.onAuthStateChanged(async (user) => {
      createTool.removeEventListener("click", onCreateToolButtonClick);
      
      authenticatedUser = user;

      if (user) {
        console.log("User logged in: ", user.uid);
        setupUi(user, loggedInLinks, loggedOutLinks, searchContainer);

        // Create new tool
        onCreateToolButtonClick = (e) => {
          console.log("onCreateToolButtonClick()");
          e.preventDefault();
          showAddToolForm(admin, form, null, null, null, null, null, select, toolImage, user, null);
        };
        createTool.addEventListener("click", onCreateToolButtonClick);

        // show admin options when tools listed
        removeAllElements(cardContainer);
        registerToolsInSelectedCategoryOnClick(snapshot, navBarCategories, user);
        await updateToolsVisibility(rememberedTools, user);
        registerToolsInSelectedSubcategoryOnClick(snapshot, navBarSubcategories, user);
      } else {
        console.log("User logged out!");
        setupUi(null, loggedInLinks, loggedOutLinks, searchContainer);
        removeAllElements(cardContainer);
        registerToolsInSelectedCategoryOnClick(snapshot, navBarCategories, null);
        await updateToolsVisibility(rememberedTools, null);
        registerToolsInSelectedSubcategoryOnClick(snapshot, navBarSubcategories, null);
      }
    })
  } catch (error) {
    console.log(error);
  }
})();

registerUploadToolToDatabaseOnSubmit(toolName, toolPrice, select, form);
registerFindToolById(searchForm);
