const searchNavigation = document.querySelector(".form-search");
const userInfo = document.querySelector(".user-info");
const navBarCategories = document.querySelector(".navBarCategories");
const navBarSubcategories = document.querySelector(".navBarSubcategories");
const cardContainer = document.querySelector(".cardContainer");
const subcategoriesSelect = document.querySelector(".subcategories");
const categoriesSelect = document.querySelector(".categories"); 

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
      
      const buttonsNavBar = document.querySelectorAll(".btnNavBar");
      toggleElement(e.target, buttonsNavBar);
      displayAndHideSubnavigation(e.target, snapshot);      
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

      const buttonsSubNavBar = document.querySelectorAll(".btnSubNavBar");
      toggleElement(e.target, buttonsSubNavBar);

      removeAllElements(cardContainer);
      
      if (toolIds) {
        displaySelectedCards(toolIds);
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

// Select pure multiselect
fetch("./docs/categories.json")
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    const categories = Object.values(data);
    const items = categories.map((category) => {
      const label = category.title;

      return {
        label: label,
        value: category.id.toString(),
      }
    });

    var instance = new SelectPure(".categories", {
      options: items,
      multiple: true, 
      placeholder: false,
      autocomplete: false,
      icon: "fa fa-times", 
      inlineIcon: false, 
      autocomplete: true,
      onChange: value => { 
        
        // remove subcategories
        // const categoriesTags = document.querySelectorAll(".categoriesTags");
        // const subcategoriesTags = document.querySelectorAll(".subcategoriesTags");

        // console.log(categoriesTags);
        // console.log(subcategoriesTags);
        // console.log(subcategoriesSelect);
        // if (categoriesTags) {
        //   removeDomElements(subcategoriesTags, subcategoriesSelect);
        // }
        
        // remove subcategories
        const subcategoriesTags = document.querySelectorAll(".subcategoriesTags");
        console.log(subcategoriesTags);
        console.log(subcategoriesSelect);
        // if (subcategoriesTags) {
          removeDomElements(subcategoriesTags, subcategoriesSelect);
        // }
          
        // get subcategories (array of arrays)
        const items = categories.map((category) => {
          subcategories = category.subcategories
          return subcategories;
        })
       
        // display corresponding subcategories 
        const categoryValues = value;
        let subItems = [];
        categoryValues.forEach((categoryValue) => {
          const array = items[parseInt(categoryValue)-1].map((subcategory) => {
            const sublabel = subcategory.title;
            return {
              label: sublabel,
              value: subcategory.id.toString()
            };
          })
          subItems = subItems.concat(array);
          return subItems;
        })
        var instance = new SelectPure(".subcategories", {
          options: subItems,
          multiple: true, 
          autocomplete: true,
          icon: "fa fa-times", 
          inlineIcon: false, 
          autocomplete: true,
          classNames: {
            select: "subcategoriesTags select-pure__select",
            dropdownShown: "select-pure__select--opened",
            multiselect: "select-pure__select--multiple",
            label: "select-pure__label",
            placeholder: "select-pure__placeholder",
            dropdown: "select-pure__options",
            option: "select-pure__option",
            autocompleteInput: "select-pure__autocomplete",
            selectedLabel: "select-pure__selected-label",
            selectedOption: "select-pure__option--selected",
            placeholderHidden: "select-pure__placeholder--hidden",
            optionHidden: "select-pure__option--hidden"
          }
        });
        instance.value();
      },
      classNames: {
        select: "categoriesTags select-pure__select",
        dropdownShown: "select-pure__select--opened",
        multiselect: "select-pure__select--multiple",
        label: "select-pure__label",
        placeholder: "select-pure__placeholder",
        dropdown: "select-pure__options",
        option: "select-pure__option",
        autocompleteInput: "select-pure__autocomplete",
        selectedLabel: "select-pure__selected-label",
        selectedOption: "select-pure__option--selected",
        placeholderHidden: "select-pure__placeholder--hidden",
        optionHidden: "select-pure__option--hidden"
      }
    }); 

    instance.value();  
  })
  .catch((error) => {
    console.log("rejected", error);
  })


//uploading the file to firebase
const fileInput = document.querySelector(".myfiles");
const uploader = document.querySelector(".uploader");

fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  const storageRef = firebase.storage().ref("images/" + file.name);

  var uploadTask = storageRef
    .put(file)
  
  monitorUploadProgress(uploadTask);
  uploadImageUrlToFirestore(storageRef);  
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

const toggleElement = (category, elements) => {
  elements.forEach((element) => {
    if (category != element) {
      element.classList.remove("active");
    } else {
      element.classList.toggle("active");
    }
  });
}

const displayAndHideSubnavigation = (category, snapshot) => {
  const categoryIndex = category.dataset.index;
  const subcategories = snapshot.docs[categoryIndex].data().subcategories;
  
  removeAllElements(navBarSubcategories);
   
  if (category.classList.contains("active")) {
    subcategories.forEach((subcategory, subcategoryIndex) => {
      addSubNavBar(subcategory, categoryIndex, subcategoryIndex);
    });
  }
}

const monitorUploadProgress = (uploadTask) => {
  uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, 
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      uploader.value = progress;
    },
    (error) => {
      console.log("error", {error});
    }
  )
}

const uploadImageUrlToFirestore = (storageRef) => {
  storageRef
    .getDownloadURL()
    .then((url) => {
      // TODO reference document (for now hardcoded .doc(1))
      const tools = db.collection("tools").doc("1")
      
      tools.set({
        image: url
      }, {merge: true});
      
      console.log("Image URL was added to firestore");
    })
}

const removeAllElements = (container) => {
  container.querySelectorAll(":scope > *").forEach((element) => {
    container.removeChild(element);
  });    
}

const removeDomElements = (elements, container) => {
  elements.forEach((element) => {
    container.removeChild(element);
  });    
}

const displaySelectedCards = (ids) => {
  ids.forEach((tool) => {
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

const addCard = (card) => {
  
  let cardId = card.id.toString();
  if (cardId.length == 1) {
    cardId = `00${cardId}`
  } else if (cardId.length == 2) {
    cardId = `0${cardId}`
  }
  console.log(cardId);

  let html = `
  <div class="col-md-6 col-lg-4 my-3">
    <div class="card text-center">
      <img class="my-image" src="${card.image || 'https://via.placeholder.com/350x200.png/999/fff'}" alt="card-img-top">
      <div class="card-header bg-primary text-white border-primary">
        ${card.name}
      </div>
      <ul class="list-group list-group-flush text-primary">
        <li class="list-group-item">Číslo pomůcky: ${cardId}</li>
        <li class="list-group-item">Orientační cena: <span>${card.price}</span>Kč</li>
        <div class="container d-none">
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
