// Define constants
const WIDTH = 960;
const HEIGHT = 960;
const COLOUR_DEFAULT = "#666420";
const COLOUR_HIGHLIGHT = "#420666";
const COLOUR_EMPTY = "#ccc";
const WIDTH_DEFAULT = "0.5px";
const WIDTH_HIGHLIGHT = "0.8px";

// Default chart options
let cause = "Neoplasms";
let year = 2015;
let sex = "Total";

// Set up map projection
var projection = d3.geoMercator()
                    .center([0, 0])
                    .translate([WIDTH / 2, HEIGHT / 2])
                    .scale(150);

var path = d3.geoPath(projection);

// Set colour range
var colour = d3.scaleSequential(d3.interpolatePurples); // d3.interpolate gives better colour scaling

// Set up SVG canvas
var svg = d3.select("#choropleth")
            .append("svg")
            .attr("width", WIDTH)
            .attr("height", HEIGHT);


// Read in data from specified file /
// Merge CSV data and GeoJSON map /
// Render map and apply fill per value
const renderChoropleth = function(cause, year, sex) {
    d3.csv(`../data/causes/${cause}.csv`).then(function(data) {
        // Convert str to num
        data.forEach(d => d.Value = +d.Value);

        // Set colour domain from new category values
        colour.domain(d3.extent(data, d => d.Value));

        // Create a lookup map to merge CSV and GeoJSON data
        // If we aren't using Sex in our vis may as well drop /
        // the column from the data sets entirely, else we /
        // should add a toggle for M/F/T.
        var dataMap = new Map();
        data.filter(d => parseInt(d.Year) === year && d.Sex === sex)
            .forEach(d => dataMap.set(d.Country, d.Value));


        // Read in GeoJSON file
        d3.json("../resources/world.geojson").then(function(json) {
            // Use lookup map to merge data
            json.features.forEach(feature => {
                feature.properties.value = dataMap.get(feature.properties.name) || null;
            });

            // // Merge map and data
            // for (var i = 0; i < data.length; i++) {
            //     // Only want one year at a time
            //     if ((parseInt(data[i].Year) == year) && (data[i].Sex == "Total")) {
            //         // Get Country and Value
            //         var country = data[i].Country;
            //         var dataValue = parseFloat(data[i].Value);
                    
            //         // Find corresponding country in GeoJSON
            //         for (var j = 0; j < json.features.length; j++) {
            //             var jsonCountry = json.features[j].properties.name;

            //             if (country == jsonCountry) {
            //                 // Copy the data value into the JSON
            //                 json.features[j].properties.value = dataValue;
            //                 break;
            //             }
            //         }
            //     }
            // }

            // Create path elements
            svg.selectAll("path")
                .data(json.features)
                .join("path") // Replaced enter() & append("path") with join("path")
                .attr("class", "country")
                .attr("d", path)
                .attr("fill", function(d) { // rewrite using ternary ? :
                    // Get data value
                    var value = d.properties.value;

                    if (value) {
                        return colour(value);
                    } else {
                        return COLOUR_EMPTY;
                    }
                })
                .attr("stroke", COLOUR_DEFAULT)
                .attr("stroke-width", WIDTH_DEFAULT)

                // mouseover should show pop-up infobox
                .on("mouseover", function(event, d) {
                    d3.select(this).style("stroke", COLOUR_HIGHLIGHT);
                    d3.select(this).style("stroke-width", WIDTH_HIGHLIGHT);
                })
                .on("mouseout", function(event, d) {
                    d3.select(this).style("stroke", COLOUR_DEFAULT);
                    d3.select(this).style("stroke-width", WIDTH_DEFAULT);
                });
        }).catch(error => console.error("Error while loading GeoJSON data:", error));
    }).catch(error => console.error("Error while loading CSV data:", error));
};


// This section is ugly as gotta fix
renderChoropleth(cause, year, sex);

// Event listener for category select
d3.select("#causes").on("change", function() {
    cause = this.value;
    renderChoropleth(cause, year, sex);
});

// Event listener for year select
d3.select("#years").on("change", function() {
    year = +this.value;
    renderChoropleth(cause, year, sex);
});

// Event listener for sex select
d3.select("#sex").on("change", function() {
    sex = this.value;
    renderChoropleth(cause, year, sex);
});


// ~-*-~-*-~
// TO DO:
// Clean the event listeners up
// Handle the calls to renderChoropleth() nicer
// Move mouseover events to separate functions
// Add mouseover pop-ups
// Path fill function probably can use a ternary
// Selection elements should display default values
