"use strict";

const createTool = document.querySelector(".create-tool");
const loggedInLinks = document.querySelectorAll(".logged-in");
const loggedOutLinks = document.querySelectorAll(".logged-out");
const navBarCategories = document.querySelector(".navbar-categories");
const navBarSubcategories = document.querySelector(".navbar-subcategories");
const cardContainer = document.querySelector(".card-container");
const categoriesSelectContainer = document.querySelector(".categories");
const subcategoriesSelectContainer = document.querySelector(".subcategories");
const admin = document.querySelector(".popup-admin-wrapper");
const form = document.getElementById("upload-form");
const toolName = document.getElementById("tool-name");
const toolPrice = document.getElementById("tool-price");
const toolCategories = document.querySelector(".tool-categories");
const toolSubcategories = document.querySelector(".tool-subcategories");
const toolSelect = document.querySelector(".tool-select");
const toolImage = document.querySelector(".tool-image");
const selectedImage = document.getElementById("selected-image");
const searchContainer = document.querySelector("#navbar-search");
const searchForm = document.querySelector(".form-search");
const searchErrorContainer = document.querySelector("#search-error-display");
const nameErrorDisplay = document.querySelector("#name-error-display");
const priceErrorDisplay = document.querySelector("#price-error-display");
const categoriesErrorDisplay = document.querySelector("#categories-error-display");
const subcategoriesErrorDisplay = document.querySelector("#subcategories-error-display");
const imageErrorDisplay = document.querySelector("#image-error-display");
const successMessageDisplay = document.querySelector("#success-message-display");

(async () => {
  try {
    console.log("index.js")

    state.categoriesAndSubcategories = await downloadCategoriesAndSubcategories();
    const categories = getCategories(state.categoriesAndSubcategories);
    
    addCategoriesToNavbar(categories);
    registerSubnavigationOnClick(navBarCategories, navBarSubcategories);
    
    auth.onAuthStateChanged(async (user) => {
      createTool.removeEventListener("click", onCreateToolButtonClick);
      
      state.authenticatedUser = user;

      if (user) {
        console.log("User logged in: ", user.uid);
        setupUi(user, loggedInLinks, loggedOutLinks, searchContainer);

        // Create new tool
        onCreateToolButtonClick = (e) => {
          console.log("onCreateToolButtonClick()");
          e.preventDefault();
          showAddToolForm(admin, form, null, null, null, null, null, toolSelect, toolImage, user, null);
        };
        createTool.addEventListener("click", onCreateToolButtonClick);

        // Show admin options when tools listed
        removeAllElements(cardContainer);
        registerToolsInSelectedCategoryOnClick(navBarCategories, user);
        await updateToolsVisibility(state.tools, user);
        registerToolsInSelectedSubcategoryOnClick(navBarSubcategories, user);
      } else {
        console.log("User logged out!");
        setupUi(null, loggedInLinks, loggedOutLinks, searchContainer);
        removeAllElements(cardContainer);
        registerToolsInSelectedCategoryOnClick(navBarCategories, null);
        await updateToolsVisibility(state.tools, null);
        registerToolsInSelectedSubcategoryOnClick(navBarSubcategories, null);
      }
    })
  } catch (error) {
    console.log(error);
  }
})();

registerUploadToolToDatabaseOnSubmit(toolName, toolPrice, toolSelect, form);
registerFindToolById(searchForm);
