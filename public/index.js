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
const loggedInLinks = document.querySelectorAll(".logged-in");
const loggedOutLinks = document.querySelectorAll(".logged-out");
const admin = document.querySelector(".popup-admin-wrapper");


(async () => {
  try {
    const snapshot = await getDatabaseCategoriesAndSubcategories("categories");
    const categories = await getCategories(snapshot);
    addCategoriesToNavbar(categories);
    displaySubnavigationOnClick(snapshot, navBarCategories, navBarSubcategories);
    
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("User logged in: ", user);
        setupUi(user, loggedInLinks, loggedOutLinks);
    
        // Create new tool
        createTool.addEventListener("click", (e) => {
          e.preventDefault();
          showAdminInterface(user, admin);
        });
    
        // show admin options when tools listed
        displayToolsInSelectedSubcategory(snapshot, navBarSubcategories, user);
    
      } else {
        console.log("User logged out!");
        setupUi(null, loggedInLinks, loggedOutLinks);
        displayToolsInSelectedSubcategory(snapshot, navBarSubcategories, null);
      }
    })
    //displayToolsInSelectedSubcategory(snapshot, navBarSubcategories);
    loadMultiselectCategories(snapshot);

  } catch (error) {
    console.log(error);
  }
})();

showAndHidePopup(signup, popupSignup, closeIconSignup);
showAndHidePopup(login, popupLogin, closeIconLogin);
findToolByNumber(searchNavigation)
uploadingToolToDatabase();
