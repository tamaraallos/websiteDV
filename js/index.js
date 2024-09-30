// Cycle through the choropleth images when button is pressed
let image = document.getElementById("choropleth-image");
let caption = document.getElementById("choropleth-caption");
let button = document.getElementById("choropleth-image-button");

let altImage = false;

function updateImage() {
  altImage = !altImage;
  if (!altImage) {
    image.src = "../resources/choropleth-basecolour.png";
    image.alt = "Initial view of the choropleth visualisation";
    caption.innerHTML = "<em>View of the choropleth visualisation with default settings</em>";
    button.innerHTML = "Alternate View";
  }
  else {
    image.src = "../resources/choropleth-altcolour.png";
    image.alt = "Alternate view of the choropleth visualisation with secondary colours and line chart";
    caption.innerHTML = "<em>Alternate view of the choropleth visualisation with a different colour palette, and with the line chart displayed</em>";
    button.innerHTML = "Default View";
  }
}

button.addEventListener("click", updateImage);
updateImage();


// Insert anchor hrefs on load
document.getElementById("a0").href="https://d3js.org/";
document.getElementById("a1").href="https://www.oecd-ilibrary.org/social-issues-migration-health/data/oecd-health-statistics_health-data-en";
document.getElementById("a2").href="https://www.oecd-ilibrary.org/social-issues-migration-health/data/oecd-health-statistics_health-data-en";
document.getElementById("a3").href="https://www.oecd-ilibrary.org/social-issues-migration-health/data/oecd-health-statistics/oecd-health-data-health-status_data-00540-en?parentId=http%3A%2F%2Finstance.metastore.ingenta.com%2Fcontent%2Fcollection%2Fhealth-data-en";
document.getElementById("a4").href="https://data-explorer.oecd.org/vis?fs[0]=Topic%2C1%7CHealth%23HEA%23%7CHealth%20status%23HEA_STA%23&pg=0&fc=Topic&bp=true&snb=16&df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_HEALTH_STAT%40DF_COM&df[ag]=OECD.ELS.HD&df[vs]=1.0";
document.getElementById("a5").href="https://www.knime.com";
