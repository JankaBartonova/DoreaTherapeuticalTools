const searchNavigation = document.querySelector(".form-search");
const userInfo = document.querySelector(".user-info");
const navBarCategories = document.querySelector(".navBarCategories");
const navBarSubcategories = document.querySelector(".navBarSubcategories");
const cardContainer = document.querySelector(".cardContainer");

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
    // display sub navigation
    navBarCategories.addEventListener("click", (e) => {

      // avoid event listener on container
      if (e.target == navBarCategories) {
        return false;
      }
      
      toggleNavigationButton(e);
      displayAndHideSubnavigation(e, snapshot);      
    });
    return snapshot;
  })
  .then((snapshot) => {
    // display tools
    navBarSubcategories.addEventListener("click", (e) => {

      // avoid event listener on container
      if (e.target == navBarSubcategories) {
        return false;
      }
 
      const categoryIndex = e.target.dataset.categoryIndex;
      const subcategoryIndex = e.target.dataset.subcategoryIndex;
      const toolIds = snapshot.docs[categoryIndex].data().subcategories[subcategoryIndex].tools;

      // toggle subnavigation buttons
      const buttonsSubNavBar = document.querySelectorAll(".btnSubNavBar");
      buttonsSubNavBar.forEach((button) => {
        if (e.target != button) {
          button.classList.remove("active");
        } else {
          button.classList.toggle("active");
        }
      });

      removeAllElements(cardContainer);

      if (toolIds) {
        toolIds.forEach((tool) => {
          db.collection("tools").where("id", "==", tool)
          .get()
          .then((snapshot) => {
            snapshot.docs.forEach((doc) => {
              addCard(doc.data());
            })
          })
          .catch((error) => {
            console.log(error);
          })
        })
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

const addNavBar = (category, index) => {
  let html = `
    <label class="btn btnNavBar btn-outline-primary" data-index="${index}">${category.title}</label>
  `
  navBarCategories.innerHTML += html;
}

const addSubNavBar = (subcategory, categoryIndex, subcategoryIndex) => {
  let html = `
    <label class="btn btnSubNavBar btn-outline-info" data-category-index="${categoryIndex}" data-subcategory-index="${subcategoryIndex}">${subcategory.title}</label>
  `
  navBarSubcategories.innerHTML += html;
}

const toggleNavigationButton = (e) => {
  const buttonsNavBar = document.querySelectorAll(".btnNavBar");
  buttonsNavBar.forEach((button) => {
    if (e.target != button) {
      button.classList.remove("active");
    } else {
      button.classList.toggle("active");
    }
  });
}

const displayAndHideSubnavigation = (e, snapshot) => {
  const categoryIndex = e.target.dataset.index;
  const subcategories = snapshot.docs[categoryIndex].data().subcategories;
  
  //const buttonsSubNavBar = document.querySelectorAll(".btnSubNavBar");
  
  //removeDomElements(buttonsSubNavBar, navBarSubcategories);
  removeAllElements(navBarSubcategories);
   
  if (e.target.classList.contains("active")) {
    subcategories.forEach((subcategory, subcategoryIndex) => {
      addSubNavBar(subcategory, categoryIndex, subcategoryIndex);
    });
  }
}

const removeAllElements = (container) => {
  container.querySelectorAll(":scope > *").forEach((element) => {
    container.removeChild(element);
  });    
}

const addCard = (card) => {
  
  let cardId = card.id.toString();
  if (cardId.length == 1) {
    cardId = `00${cardId}`
  } else if (cardId.length == 2) {
    cardId = `0${cardId}`
  }

  let html = `
  <div class="col-md-6 col-lg-4 my-3">
    <div class="card text-center">
      <img src="https://via.placeholder.com/350x200.png/999/fff" alt="card-img-top">
      <div class="card-header bg-primary text-white border-primary">
        <span class="px-3">${cardId}</span>${card.name}
      </div>
      <ul class="list-group list-group-flush text-primary">
        <li class="list-group-item">Orientační cena: <span>${card.price}</span>Kč</li>
        <div class="container">
          <div class="row py-2 px-2 d-flex justify-content-center">
            <a href="#" class="btn col-sm-5 mx-2 btn-primary">Upravit</a>
            <a href="#" class="btn col-sm-5 mx-2 btn-danger">Smazat</a>
          </div>
        </div>
      </ul>
    </div>
  </div>
  `
  cardContainer.innerHTML += html;
}