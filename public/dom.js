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

const addCard = (card) => {
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
}

const addCategoriesMultiselect = (parent, _class, options, values, onChange) => {

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

const registerDeleteTools = () => {
  const deleteTools = document.querySelectorAll(".delete-tool");
  deleteTools.forEach((deleteTool) => {
    console.log(deleteTool);
    registerDeleteToolOnClick(deleteTool);
  });
}

const registerModifyTools = () => {
  const modifyTools = document.querySelectorAll(".modify-tool");
  modifyTools.forEach((modifyTool) => {
    console.log(modifyTool);
    registerModifyToolOnClick(modifyTool);
  });
}

const showSelectedTools = (tools, user) => {
  tools.forEach((tool) => {
    addCard(tool);
  });

  displayAdminOptions(user);
  registerDeleteTools();
  registerModifyTools();
}

const updateToolsVisibility = (toolIds, user) => {
  removeAllElements(cardContainer);

  if (toolIds) {
    displaySelectedTools(toolIds, user);
  }
}

const loadMultiselectSubcategories = (values, categories, container) => {
  removeAllElements(container);

  // if category is empty, do not show subcategories
  if (values.length == 0) {
    return;
  }

  const multiselectSubCategories = getSubcategories(categories);
  const subItems = getMultiselectSubcategories(values, multiselectSubCategories);
  subcategoriesSelect = addCategoriesMultiselect(
    ".subcategories",
    "subcategoriesTags",
    subItems,
    rememberedSubcategories,
    (values) => {
      rememberedSubcategories = values;
    });
}

const getMultiselectSubcategories = (values, multiselectSubcategories) => {
  const categoryValues = values;
  let subItems = [];
  categoryValues.forEach((categoryValue) => {
    const array = multiselectSubcategories[parseInt(categoryValue) - 1].map((subcategory) => {
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

const resetForm = (form, categoriesSelect, subcategoriesSelect) => {
  form.reset();
  document.querySelector(".tool-image").src = "";
  if (categoriesSelect) {
    categoriesSelect.reset();
  }
  if (subcategoriesSelect) {
    subcategoriesSelect.reset();
  }
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

const showAndHidePopup = (action, popup, close) => {
  action.addEventListener("click", (e) => {
    popup.classList.remove("d-none");
  });
  close.addEventListener("click", (e) => {
    popup.classList.add("d-none");
  });
}

const setupUi = (user, loggedInLinks, loggedOutLinks) => {
  if (user) {
    loggedInLinks.forEach((link) => {
      link.classList.remove("d-none");
    });
    loggedOutLinks.forEach((link) => {
      link.classList.add("d-none");
    });
  } else {
    loggedInLinks.forEach((link) => {
      link.classList.add("d-none");
    });
    loggedOutLinks.forEach((link) => {
      link.classList.remove("d-none");
    });
    admin.classList.add("d-none");
  }
}

const showAddToolForm = (domElement, edit, user) => {
  if (user) {
    if (edit == null) {
      domElement.classList.remove("d-none");
    } else {
      domElement.classList.remove("d-none");
      toolNameElement.placeholder = "Nový placeholder";
    }
  } else {
    domElement.classList.add("d-none");
  }
}

// const showAdminInterface = (user, admin) => {
//   if (user) {
//     admin.classList.remove("d-none");
//   } else {
//     admin.classList.add("d-none");
//   }
// }
