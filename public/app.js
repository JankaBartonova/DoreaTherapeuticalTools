//const navCategory = document.querySelector("#btn-check-miminka");
//const navSubCategory = document.querySelector(".miminka");
const searchNavigation = document.querySelector(".form-search");
const userInfo = document.querySelector(".user-info");
const navBarCategories = document.querySelector(".navBarCategories"); 

const addNavBar = (category) => {
  let html = `
    <input type="checkbox" class="btn-check hide" id="btn-check-${category.title}" autocomplete="off">
    <label class="btn btn-outline-primary" for="btn-check-${category.title}">${category.title}</label>
  `
  navBarCategories.innerHTML += html;
}

// Read navbar categories from Firebase, display it under jumbletron
db.collection("categories")
  .get()
  .then((snapshot) => {
    snapshot.docs.forEach(doc => {
      addNavBar(doc.data());
    });
  }).catch((err) => {
    console.log(err);
  });

/*
// when navigation button clicked, show subnavigation
navCategory.addEventListener("click", () => {
  navCategory.classList.toggle("active");
  navSubCategory.classList.toggle("active");

  if (navSubCategory.classList.contains("active")) {
    navSubCategory.classList.remove("d-none");
  } else {
    navSubCategory.classList.add("d-none");
  }
});
*/

// search navigation user input
searchNavigation.addEventListener("submit", (e) => {
  e.preventDefault();
  const toolNumberUser = searchNavigation.search.value;

  let toolsAmount = 356;

  const toolPattern = /^[0-9]+$/
  if (toolPattern.test(toolNumberUser)) {
    console.log("Tool is a number");

  } else {
    console.log("Tool is not a number");
    userInfo.textContent = `Číslo pomůcky může být pouze číslo! Aktuálně nabízíme ${toolsAmount} pomůcek.`;
    userInfo.style.color = "crimson";
    userInfo.style.fontWeight = "bold";
  }
});


