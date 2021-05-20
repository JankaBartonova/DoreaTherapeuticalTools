const addNavBar = (domElement, category, index) => {
  let html = `
    <label class="btn btnNavBar btn-outline-primary" data-index="${index}">${category}</label>
  `
  domElement.innerHTML += html;
}

const addSubNavBar = (domElement, subcategory, categoryIndex, subcategoryIndex) => {
  let html = `
    <label class="btn btnSubNavBar btn-outline-info" data-category-index="${categoryIndex}" data-subcategory-index="${subcategoryIndex}">${subcategory.title}</label>
  `
  domElement.innerHTML += html;
}

const displayAndHideSubnavigation = (domElement, category, snapshot) => {
  const categoryIndex = category.dataset.index;
  const subcategories = snapshot.docs[categoryIndex].data().subcategories;
  
  removeAllElements(domElement);
   
  if (category.classList.contains("active")) {
    subcategories.forEach((subcategory, subcategoryIndex) => {
      addSubNavBar(domElement, subcategory, categoryIndex, subcategoryIndex);
    });
  }
}

const removeAllElements = (container) => {
  container.querySelectorAll(":scope > *").forEach((element) => {
    container.removeChild(element);
  });    
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

const addCard = (card) => {
  // let cardId = card.id;
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

const addMultiselectCategories = (parent, _class, options, onChange) => {
  return new SelectPure(parent, {
    options: options,
    multiple: true,
    autocomplete: true,
    icon: "fa fa-times",
    inlineIcon: false,
    autocomplete: true,
    onChange: onChange,
    classNames: {
      select: _class + " select-pure__select",
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
}

const showSelectedCards = (tools) => {
  tools.forEach((tool) => {
    addCard(tool);
  })  
}

const displayAndHideTools = (target, snapshot) => {
  const categoryIndex = target.dataset.categoryIndex;
  const subcategoryIndex = target.dataset.subcategoryIndex;
  const toolIds = snapshot.docs[categoryIndex].data().subcategories[subcategoryIndex].tools;
  console.log(toolIds)

  removeAllElements(cardContainer);
  
  if (toolIds) {
    displaySelectedCards(toolIds);
  }
}

const loadMultiselectSubcategories = (value, categories, container) => {
  removeAllElements(container);

  // if category is empty, do not show subcategories
  if (value.length == 0) {
    return;
  }

  const multiselectSubCategories = getSubcategories(categories);
  const subItems = addMultiselectSubCategories(value, multiselectSubCategories);        
  subcategoriesSelect = addMultiselectCategories(
    ".subcategories",
    "subcategoriesTags",
    subItems,
    (value) => {console.log("subitem change", value)});
    
  // console.log(subcategoriesSelectContainer)
  subcategoriesSelectContainer.addEventListener("change", (event) => {
    console.log(event.target.value);
  })
}

const addMultiselectSubCategories = (value, multiselectSubCategories) => {
  const categoryValues = value;
  let subItems = [];
  categoryValues.forEach((categoryValue) => {
    const array = multiselectSubCategories[parseInt(categoryValue) - 1].map((subcategory) => {
      const sublabel = subcategory.title;
      return {
        label: sublabel,
        value: subcategory.id.toString()
      };
    })
    subItems = subItems.concat(array);
    return subItems;
  });
  return subItems;
}

const findToolByNumber = (domElement) => {
  domElement.addEventListener("submit", (e) => {
    e.preventDefault();
    const toolNumberUser = domElement.search.value;
  
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
}
