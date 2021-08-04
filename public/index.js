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

(async () => {
  try {
    console.log("index.js")

    const snapshot = await getDatabaseCategoriesAndSubcategories("categories");
    categoriesAndSubcategoriesGlobal = getCategoriesAndSubcategories(snapshot);
    console.log(categoriesAndSubcategoriesGlobal)
    const categories = getCategories(categoriesAndSubcategoriesGlobal);
    addCategoriesToNavbar(categories);
    registerSubnavigationOnClick(categoriesAndSubcategoriesGlobal, navBarCategories, navBarSubcategories);
    
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
          showAddToolForm(admin, form, null, null, null, null, null, toolSelect, toolImage, user, null);
        };
        createTool.addEventListener("click", onCreateToolButtonClick);

        // show admin options when tools listed
        removeAllElements(cardContainer);
        registerToolsInSelectedCategoryOnClick(categoriesAndSubcategoriesGlobal, navBarCategories, user);
        await updateToolsVisibility(rememberedTools, user);
        registerToolsInSelectedSubcategoryOnClick(categoriesAndSubcategoriesGlobal, navBarSubcategories, user);
      } else {
        console.log("User logged out!");
        setupUi(null, loggedInLinks, loggedOutLinks, searchContainer);
        removeAllElements(cardContainer);
        registerToolsInSelectedCategoryOnClick(categoriesAndSubcategoriesGlobal, navBarCategories, null);
        await updateToolsVisibility(rememberedTools, null);
        registerToolsInSelectedSubcategoryOnClick(categoriesAndSubcategoriesGlobal, navBarSubcategories, null);
      }
    })
  } catch (error) {
    console.log(error);
  }
})();

registerUploadToolToDatabaseOnSubmit(toolName, toolPrice, toolSelect, form);
registerFindToolById(searchForm);
