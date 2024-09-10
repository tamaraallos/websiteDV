// Define constants
const WIDTH = 960;
const HEIGHT = 960;
const COLOUR_DEFAULT = "#666420";
const COLOUR_HIGHLIGHT = "#420666";
const COLOUR_EMPTY = "#ccc";
const WIDTH_DEFAULT = "0.5px";
const WIDTH_HIGHLIGHT = "0.8px";

// Default chart options
let sex = "Total";

// Set up map projection
let projection = d3.geoMercator()
                    .center([0, 0])
                    .translate([WIDTH / 2, HEIGHT / 2])
                    .scale(150);

let path = d3.geoPath(projection);

// Set colour range
let colour = d3.scaleSequential(d3.interpolatePurples); // d3.interpolate gives better colour scaling

// Set up SVG canvas
let svg = d3.select("#choropleth")
            .append("svg")
            .attr("width", WIDTH)
            .attr("height", HEIGHT);

// Empty array for entire data
let allData = [];

// Merge CSV data and GeoJSON map /
// Render map and apply fill per value
function renderChoropleth(cause, year, sex) {
    // Have to filter data first to get correct domain for cause
    let filteredData = allData.filter(d => d.Cause === cause && parseInt(d.Year) === year && d.Sex === sex);

    // Set colour domain from new category values
    colour.domain(d3.extent(filteredData, d => d.Value));

    // Create a lookup map to merge CSV and GeoJSON data
    let dataMap = new Map();
    // split this into two sections -> need to filter before updating domain
    filteredData.forEach(d => dataMap.set(d.Country, d.Value));

    // Read in GeoJSON file
    // try figure out if can move this to only read the geojson once but don't think so
    d3.json("../resources/world.geojson").then(function(json) {
        // Use lookup map to merge data
        json.features.forEach(feature => {
            feature.properties.value = dataMap.get(feature.properties.name) || null;
        });

        // Create path elements
        svg.selectAll("path")
            .data(json.features)
            .join("path")
            .attr("class", "country")
            .attr("d", path)   
            // If d.properties.value exists return colour else empty
            .attr("fill", d => d.properties.value ? colour(d.properties.value) : COLOUR_EMPTY)
            .attr("stroke", COLOUR_DEFAULT)
            .attr("stroke-width", WIDTH_DEFAULT)

            // mouseover should show pop-up infobox
            // probably move these to separate functions cause will get beefy with the hover stuff
            .on("mouseover", function(event, d) {
                d3.select(this).style("stroke", COLOUR_HIGHLIGHT)
                    .style("stroke-width", WIDTH_HIGHLIGHT);
            })
            .on("mouseout", function(event, d) {
                d3.select(this).style("stroke", COLOUR_DEFAULT)
                    .style("stroke-width", WIDTH_DEFAULT);
            });
    }).catch(error => console.error("Error while loading GeoJSON data:", error));
};

// Takes a set of causes and creates a select /
// menu with an option for each cause.
function createCauses(uniqueCauses) {
    // add select element
    let select = d3.select("#causes")
                    .append("select")
                    .attr("id", "cause-select");

    // Bind set of causes to options /
    // and append to select element
    select.selectAll("option")
            .data(uniqueCauses)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

    cause = uniqueCauses[0]; // default to first value
    
    // Event listener for category select
    select.on("change", function() {
        cause = this.value;
        renderChoropleth(cause, year, sex);
    });
};

// Takes array of [min, max] Year /
// and creates labelled slider.
function createYears(rangeYears) {
    let yearDiv = d3.select("#years");

    let yearLabel = yearDiv.append("label")
                    .attr("id", "year-label")
                    .text(`Year: ${rangeYears[0]}`); // default to min year
                    
    let slider = yearDiv.append("input")
                        .attr("type", "range")
                        .attr("min", rangeYears[0])
                        .attr("max", rangeYears[1])
                        .attr("value", rangeYears[0]) // default to min year
                        .attr("step", 1);

    year = rangeYears[0]; // default to min year

    // Update label and choro on change
    slider.on("input", function() {
        year = +this.value; // convert to num
        yearLabel.text(`Year: ${year}`);
        renderChoropleth(cause, year, sex);
    });
};

// Read in data from specified file
d3.csv("../data/causes/all-top-level-causes.csv").then(function(data) {
    // Convert str to num
    data.forEach(d => d.Value = +d.Value);

    // Store all data
    allData = data;

    // create set of causes and pass set to dropdown creation function
    let uniqueCauses = Array.from(new Set(allData.map(d => d.Cause)));
    createCauses(uniqueCauses);

    // get min and max of all years and create slider
    let rangeYears = d3.extent(allData, d => +d.Year); // convert str to num
    createYears(rangeYears);

    let sex = "Total";

    // Render initial view with default options
    renderChoropleth(cause, year, sex);
}).catch(error => console.error("Error fetching CSV data: ", error));

// Event listener for sex select
d3.select("#sex").on("change", function() {
    sex = this.value;
    renderChoropleth(cause, year, sex);
});


// ~-*-~-*-~
// TO DO:
// Move mouseover events to separate functions
// Add mouseover pop-ups
// Reduce opacity of irrelevant countries
// Add hover effects for countries
