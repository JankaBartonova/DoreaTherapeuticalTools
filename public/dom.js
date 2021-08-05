"use strict";

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

const updateSubnavigationVisibility = (domElement, category, subcategories, categoryIndex) => {
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

const addToolToDom = (card) => {
  // let cardId = card.id;
  let cardId = card.id.toString();
  if (cardId.length == 1) {
    cardId = `00${cardId}`
  } else if (cardId.length == 2) {
    cardId = `0${cardId}`
  }

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
        <div class="admin-options container d-none">
          <div class="row py-2 px-2 d-flex justify-content-center">
            <a href="#" class="modify-tool btn col-sm-5 mx-2 btn-primary" data-id="${card.id}">Upravit</a>
            <a href="#" class="delete-tool btn col-sm-5 mx-2 btn-danger" data-id="${card.id}">Smazat</a>
          </div>
        </div>
      </ul>
    </div>
  </div>
  `
  cardContainer.innerHTML += html;

  registerDeleteTool(state.authenticatedUser); 
  registerModifyTool(state.authenticatedUser); 
}

const addMultiselect = (parent, _class, options, values, onChange) => {
  values = values.filter((value) => {
    return options.find((option) => {
      return option.value == value;
    });
  })

  return new SelectPure(parent, {
    options: options,
    value: values,
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

const displayAdminOptions = (user) => {
  const adminOptions = document.querySelectorAll(".admin-options");
  if (user) {
    adminOptions.forEach((option) => {
      option.classList.remove("d-none");
    });
  } else {
    adminOptions.forEach((option) => {
      option.classList.add("d-none");
    });
  }
}

const registerDeleteTool = (user) => {
  const deleteTools = document.querySelectorAll(".delete-tool");
  deleteTools.forEach((deleteTool) => {
    registerDeleteToolOnClick(deleteTool, user);
  });
}

const registerModifyTool = (user) => {
  const modifyTools = document.querySelectorAll(".modify-tool");
  modifyTools.forEach((modifyTool) => {
    registerModifyToolOnClick(modifyTool, user);
  });
}

const showSelectedTools = (tools, user) => {
  tools.forEach((tool) => {
    addToolToDom(tool);
  });

  displayAdminOptions(user);
}

const updateToolsVisibility = async (toolIds, user) => {
  console.log("updateToolsVisibility()");
  removeAllElements(cardContainer);

  if (toolIds) {
    await displaySelectedTools(toolIds, user);
  }
}

const extractCategories = (values) => {
  let categoryValues = new Set();

  if (values.length) {
    values.forEach((value) => {
      if (value.includes(":")) {
        categoryValues.add(value.charAt(0));
      } else {
        categoryValues.add(value)
      }
    })
  }

  // QUESTION: is it confusing to assing to existing variable of type Set function that converts it info Array? Or is ot better to have another variable?
  categoryValues = convertSetToArray(categoryValues);
  return categoryValues;
}

const getMultiselectSubItems = (values, subcategories) => {
  const categoryValues = extractCategories(values);

  let subItems = [];
  categoryValues.forEach((categoryValue) => {
    const array = subcategories[parseInt(categoryValue) - 1].map((subcategory) => {
      const sublabel = subcategory.title;
      return {
        label: sublabel,
        value: subcategory.id.toString()
      };
    })
    subItems = subItems.concat(array);
  });
  return subItems;
}

const resetForm = (form) => {
  console.log("resetForm()")

  form.reset();
  removeMultiselectIntances();
  insertMultiselectInstances([], []);
  document.querySelector(".tool-image").src = "";
}

const showImage = (image) => {
  document.querySelector(".tool-image").src = image;
}

const waitForClick = (element) => {
  return new Promise((resolve) => {
    const handler = async (e) => {
      e.preventDefault();
      element.removeEventListener("click", handler);
      resolve(true);
    }
    element.addEventListener("click", handler);
  })
}

const setupUi = (user, loggedInLinks, loggedOutLinks, searchContainer) => {
  if (user) {
    loggedInLinks.forEach((link) => {
      link.classList.remove("d-none");
    });
    loggedOutLinks.forEach((link) => {
      link.classList.add("d-none");
    });
    searchContainer.classList.remove("d-none");
  } else {
    loggedInLinks.forEach((link) => {
      link.classList.add("d-none");
    });
    loggedOutLinks.forEach((link) => {
      link.classList.remove("d-none");
    });
    admin.classList.add("d-none");
    searchContainer.classList.add("d-none");
  }
}

const removeMultiselectInstance = (container) => {
  while (container.firstChild) {
    container.firstChild.remove();
  }
}

const resetAllFieldsForm = (formElement, selectElement, toolImageElement, modifiedTool) => {
  formElement.reset();
  if (widgets.categoriesSelect) {
    removeMultiselectInstance(categoriesSelectContainer);
  }
  if (widgets.subcategoriesSelect) {
    removeMultiselectInstance(subcategoriesSelectContainer);
  }
  changeButtonName(selectElement, "Vyberte obrázek");
  toolImageElement.src = "";

  if (!modifiedTool) {
    delete formElement.dataset.toolid;
  }

  selectedImage.value = false;
}

const removeMultiselectIntances = () => {
  console.log("removeMultiselectInstances()");
  if (widgets.categoriesSelect) {
    removeMultiselectInstance(categoriesSelectContainer);
  }
  if (widgets.subcategoriesSelect) {
    removeMultiselectInstance(subcategoriesSelectContainer);
  }
}

const setDatabaseValues = (toolNameElement, toolPriceElement, toolImageElement, tool) => {
  toolNameElement.value = `${tool.name}`;
  toolPriceElement.value = `${tool.price}`;
  toolImageElement.src = `${tool.image}`;
};

const insertMultiselectInstances = async (selectedCategories, selectedSubcategories) => {
  console.log("insertMultiselectInstances()")
  
  await createCategoriesSelect(selectedCategories);

  if (selectedSubcategories.length) {
    state.subcategories = selectedSubcategories;
  } else {
    state.subcategories = [];
  }
   
  await createSubcategoriesSelect(selectedCategories, state.subcategories);
}

const saveToolReferenceToDomElement = (formElement, tool) => {
  formElement.dataset.toolid = `${tool.id}`;
}

const showAdminInterface = (adminElement) => {
  adminElement.classList.remove("d-none");
}

const showAddToolForm = async (adminElement, formElement, edit, toolNameElement, toolPriceElement, selectedCategories, selectedSubcategories, selectElement, toolImageElement, user, tool) => {  
  console.log("showAddToolForm()");

  if (user) {
    if (edit == null) {
      resetAllFieldsForm(formElement, selectElement, toolImageElement, edit);
      insertMultiselectInstances([], []);
      showAdminInterface(adminElement);
    } else {
      showAdminInterface(adminElement);
      setDatabaseValues(toolNameElement, toolPriceElement, toolImageElement, tool);
      changeButtonName(selectElement, "Změnit obrázek");
      removeMultiselectIntances();
      insertMultiselectInstances(selectedCategories, selectedSubcategories);
      saveToolReferenceToDomElement(formElement, tool);
    }
  } else {
    adminElement.classList.add("d-none");
  }
}

const showErrorToolDoesNotExist = (container, id) => {
  let html = `
  <h4 class="search-error-display-message">Pomůcka s pořadovým číslem ${id} v databázi neexistuje</h4> 
  `
  container.innerHTML += html;
}

const showInputValidationError = (container) => {
  let html = `
  <h4 class="search-error-display-message">Pořadové číslo pomůcky musí být číslo. Nejsou povolená písmena a speciální znaky.</h4> 
  `
  container.innerHTML += html;
}

const getToolDataFromUser = (formElement, toolNameElement, toolPriceElement) => {
  const modifiedToolId = parseInt(formElement.dataset.toolid) || -1;
  const imageChanged = convertStringToBoolean(selectedImage.value);
  const name = toolNameElement.value;
  const price = toolPriceElement.value;

  return {
    modifiedToolId: modifiedToolId,
    imageChanged: imageChanged,
    name: name,
    price: price 
  }
}