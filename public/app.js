const searchNavigation = document.querySelector(".form-search");
const userInfo = document.querySelector(".user-info");
const navBarCategories = document.querySelector(".navBarCategories"); 

const addNavBar = (category) => {
  let html = `
    <label class="btn btnNavBar btn-outline-primary" for="btn-radio-${category.title}">${category.title}</label>
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
  })
  .catch((err) => {
    console.log(err);
  });

// when navigation button clicked, show subnavigation
navBarCategories.addEventListener("click", (e) => {
  
  // avoid event listener on container
  if (e.target == navBarCategories) {
    return false;
  }

  const buttonNavBar = document.querySelectorAll(".btnNavBar");
  buttonNavBar.forEach((button) => {
    if (e.target != button) {
      button.classList.remove("active");
    }
  });

  e.target.classList.toggle("active");

  db.collection("categories")
    .get()
    .then((snapshot) => {
      const subcategories = snapshot.docs[0].data().subcategories;
      subcategories.forEach((subcategory) => {
        console.log(subcategory.title)
      });
    })
    .catch((err) => {
      console.log(err);
    });

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
