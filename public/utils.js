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