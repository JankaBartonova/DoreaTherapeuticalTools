const loadFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  let onLoad = null;
  let onError = null;

  onLoad = () => {
    console.log({ onLoad, onError });

    reader.removeEventListener("load", onLoad);
    reader.removeEventListener("error", onError);
    if (reader.result == "data:") {
      reject("Empty image");
    } else {
      resolve(reader.result);
    }
  }

  onError = () => {
    console.log({ onLoad, onError });

    reader.removeEventListener("load", onLoad);
    reader.removeEventListener("error", onError);
    reject(reader.error);
  }

  reader.addEventListener("load", onLoad);
  reader.addEventListener("error", onError);

  reader.readAsDataURL(file);
});

const convertSetToArray = (toolIdsSet) => {
  return Array.from(toolIdsSet);
};

const changeButtonName = (selectElement, text) => {
  selectElement.innerHTML = text;
};

const convertStringToBoolean = (string) => {
  switch (string.trim().toLowerCase()) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      throw new Error ("ConvertStringToBoolean: Cannot convert string to boolean.");
  }
};

const findElementsById = (arrayOfObjects, id) => {
  return arrayOfObjects.find((object) => {
    return object.id == id;
  })
}