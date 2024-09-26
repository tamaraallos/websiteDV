// Cycles through the choropleth images when button is pressed.

let image = document.getElementById("choropleth-image");
let caption = document.getElementById("choropleth-caption");

let altImage = false;

function updateImage() {
  if (altImage) {
    image.src = "../resources/choropleth-basecolour.png";
    image.alt = "Initial view of the choropleth visualisation";
    caption.innerHTML = "<em>View of the choropleth visualisation with default settings</em>";
  }
  else {
    image.src = "../resources/choropleth-altcolour.png";
    image.alt = "Alternate view of the choropleth visualisation with secondary colours and line chart";
    caption.innerHTML = "<em>Alternate view of the choropleth visualisation with a different colour palette, and with the line chart displayed</em>";
  }
  altImage = !altImage;
}

document.getElementById("choropleth-image-button").addEventListener("click", updateImage);
updateImage();
