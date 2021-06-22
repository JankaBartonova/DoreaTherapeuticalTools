const searchForm = document.querySelector(".form-search");
const navBarCategories = document.querySelector(".navbar-categories");
const navBarSubcategories = document.querySelector(".navbar-subcategories");
const cardContainer = document.querySelector(".card-container");
const subcategoriesSelectContainer = document.querySelector(".subcategories");
const toolSubcategories = document.querySelector(".tool-subcategories");
const signup = document.querySelector(".sign");
const popupSignup = document.querySelector(".popup-signup-wrapper");
const closeIconSignup = document.querySelector(".popup-signup-close");
const login = document.querySelector(".login");
const popupLogin = document.querySelector(".popup-login-wrapper");
const closeIconLogin = document.querySelector(".popup-login-close");
const loggedInLinks = document.querySelectorAll(".logged-in");
const loggedOutLinks = document.querySelectorAll(".logged-out");
const admin = document.querySelector(".popup-admin-wrapper");
const toolName = document.getElementById("tool-name");
const toolPrice = document.getElementById("tool-price");
const select = document.getElementById("select");
const form = document.getElementById("upload-form");

(async () => {
  try {
    const snapshot = await getDatabaseCategoriesAndSubcategories("categories");
    const categories = getCategories(snapshot);
    addCategoriesToNavbar(categories);
    registerSubnavigationOnClick(snapshot, navBarCategories, navBarSubcategories);
    createMultiselectCategories(snapshot);

    auth.onAuthStateChanged((user) => {
      createTool.removeEventListener("click", onCreateToolButtonClick);
      
      if (user) {
        console.log("User logged in: ", user);
        setupUi(user, loggedInLinks, loggedOutLinks);

        // Create new tool
        onCreateToolButtonClick = (e) => {
          console.log("on create tool button click");
          e.preventDefault();
          showAddToolForm(admin, null, null, null, user, null);
        };
        createTool.addEventListener("click", onCreateToolButtonClick);

        // // Create new tool
        // onCreateToolButtonClick = (e) => {
        //   console.log("on create tool button click");
        //   e.preventDefault();
        //   showAdminInterface(user, admin);
        // };
        // createTool.addEventListener("click", onCreateToolButtonClick);

        // show admin options when tools listed
        removeAllElements(cardContainer);
        registerToolsInSelectedCategoryOnClick(snapshot, navBarCategories, user);
        updateToolsVisibility(rememberedTools, user);
        registerToolsInSelectedSubcategoryOnClick(snapshot, navBarSubcategories, user);
      } else {
        console.log("User logged out!");
        setupUi(null, loggedInLinks, loggedOutLinks);
        removeAllElements(cardContainer);
        registerToolsInSelectedCategoryOnClick(snapshot, navBarCategories, null);
        updateToolsVisibility(rememberedTools, null);
        registerToolsInSelectedSubcategoryOnClick(snapshot, navBarSubcategories, null);
      }
    })
  } catch (error) {
    console.log(error);
  }
})();

showAndHidePopup(signup, popupSignup, closeIconSignup);
showAndHidePopup(login, popupLogin, closeIconLogin);
uploadingToolToDatabase(toolName, toolPrice, select, form);
