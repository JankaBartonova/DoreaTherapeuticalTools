const searchNavigation = document.querySelector(".form-search");
const userInfo = document.querySelector(".user-info");
const navBarCategories = document.querySelector(".navBarCategories");
const navBarSubcategories = document.querySelector(".navBarSubcategories")

const addNavBar = (category, index) => {
  let html = `
    <label class="btn btnNavBar btn-outline-primary" data-index="${index}">${category.title}</label>
  `
  navBarCategories.innerHTML += html;
}

const addSubNavBar = (category, index) => {
  let html = `
    <label class="btn btnSubNavBar btn-outline-info" data-index="${index}">${category.title}</label>
  `
  navBarSubcategories.innerHTML += html;
}

// Read navbar categories from Firebase, display it under jumbletron
db.collection("categories")
  .get()
  .then((snapshot) => {
    snapshot.docs.forEach((doc, index) => {
      addNavBar(doc.data(), index);
    });
    return snapshot;
  })
  .then((snapshot) => {
    // when navigation button clicked, show subnavigation
    navBarCategories.addEventListener("click", (e) => {

      // avoid event listener on container
      if (e.target == navBarCategories) {
        return false;
      }

      // navigation button toggling
      const buttonNavBar = document.querySelectorAll(".btnNavBar");
      buttonNavBar.forEach((button) => {
        if (e.target != button) {
          button.classList.remove("active");
        } else {
          button.classList.toggle("active");
        }
      });

      // get subcategories and create html template
      const index = e.target.dataset.index;
      const subcategories = snapshot.docs[index].data().subcategories;
      
      // display and hide subnavbar (on click)
      const buttonsSubNavBar = document.querySelectorAll(".btnSubNavBar");
      buttonsSubNavBar.forEach((button) => {
        navBarSubcategories.removeChild(button);
      });
      if (e.target.classList.contains("active")) {
        subcategories.forEach((subcategory) => {
          addSubNavBar(subcategory, index);
        });
      }
    });
  }) 
  .catch((error) => {
    console.log(error);
  });

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
