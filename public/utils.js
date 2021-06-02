const loadFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.addEventListener("load", (e) => {
    if (reader.result == "data:") {
      reject("Empty image");
    } else {
      resolve(reader.result);
    }
  });

  reader.addEventListener("error", (e) => {
    reject(reader.error);
  })

  reader.readAsDataURL(file);
});
