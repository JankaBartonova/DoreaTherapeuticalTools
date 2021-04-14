const searchNavigation = document.querySelector(".form-search");
const userInfo = document.querySelector(".user-info");
const navBarCategories = document.querySelector(".navBarCategories");
const navBarSubcategories = document.querySelector(".navBarSubcategories");
const cardContainer = document.querySelector(".cardContainer");
const subcategoriesSelect = document.querySelector(".subcategories");
const toolSubcategories = document.querySelector(".toolSubcategories");

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

findToolByNumber(searchNavigation)

//uploading the file to firebase
const fileInput = document.querySelector(".myfiles");

fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  const storageRef = firebase.storage().ref("images/" + file.name);

  storageRef
    .put(file)
    .then(() => {
      console.log('Uploaded file to Firebase Storage!');
    })
    .then(() => {
      uploadImageUrlToFirestore(storageRef);
    });
});
