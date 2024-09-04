// Define constants
var w = 960;
var h = 960;

// Set up map projection
var projection = d3.geoMercator()
                    .center([0, 0])
                    .translate([w / 2, h / 2])
                    .scale(150);

var path = d3.geoPath(projection);

// Set colour range
var colour = d3.scaleQuantize()
                // Color-Brewer
                .range(['#f1eef6','#d7b5d8','#df65b0','#dd1c77','#980043']);

// Set up SVG canvas
var svg = d3.select("#choropleth")
            .append("svg")
            .attr("width", w)
            .attr("height", h);


// Read in data from specified file /
// Merge CSV data and GeoJSON map /
// Render map and apply fill per value
const renderChoropleth = function(cause, year) {
    d3.csv(`../data/causes/${cause}.csv`).then(function(data) {
        // Convert str to num
        data.forEach(d => d.Value = +d.Value);

        colour.domain([
            d3.min(data, d => d.Value),
            d3.max(data, d => d.Value)
        ]);


        // Can use map() to replace this section with "better" code
        // Read in GeoJSON file
        d3.json("../resources/world.geojson").then(function(json) {
            // Merge map and data
            for (var i = 0; i < data.length; i++) {
                // Only want one year at a time
                if (parseInt(data[i].Year) == year) {
                    // Get Country and Value
                    var country = data[i].Country;
                    var dataValue = parseFloat(data[i].Value);
                    
                    // Find corresponding country in GeoJSON
                    for (var j = 0; j < json.features.length; j++) {
                        var jsonCountry = json.features[j].properties.name;

                        if (country == jsonCountry) {
                            // Copy the data value into the JSON
                            json.features[j].properties.value = dataValue;
                            break;
                        }
                    }
                }
            }

            // Create path elements
            svg.selectAll("path")
                .data(json.features)
                .join("path") // Replaced enter() & append("path") with join("path")
                .attr("class", "country")
                .attr("d", path)
                .attr("fill", function(d) {
                    // Get data value
                    var value = d.properties.value;

                    if (value) {
                        return colour(value);
                    } else {
                        return "#ccc";
                    }
                })
                .attr("stroke", "#666420")
                .attr("stroke-width", "0.5px")

                // mouseover should show pop-up infobox
                .on("mouseover", function(event, d) {
                    d3.select(this).style("stroke", "#420666");
                    d3.select(this).style("stroke-width", "0.8px");
                })
                .on("mouseout", function(event, d) {
                    d3.select(this).style("stroke", "#666420");
                    d3.select(this).style("stroke-width", "0.5px");
                });
        }).catch(function (error) {
            console.error("Error while loading or parsing data:", error);
        });
    }).catch(function (error) {
        console.error("Error while loading or parsing data:", error);
    });
};

// Event listener for category select
// need to update the cause and year variables rather than /
// immediately using this input to change the data because /
// we'll need either the cause or the year to be persistent /
// when changing the other.
d3.select("#causes").on("change", function() {
    renderChoropleth(this.value, year);
});

// Initial render with default category and year
var cause = "Neoplasms";
var year = 2015;

renderChoropleth(cause, year);
