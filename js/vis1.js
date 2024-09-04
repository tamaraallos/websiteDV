// Define constants
var w = 960;
var h = 960;

// Set up map projection
var projection = d3.geoMercator()
                    .center([0, 0])
                    .translate([w / 2, h / 2])
                    .scale(150);

var path = d3.geoPath(projection);

// Set up SVG canvas
var svg = d3.select("#choropleth")
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .attr("fill", "grey");


// Need to put this inside the csv read as per lab 8.2
// Read in GeoJSON file
d3.json("../resources/world.geojson").then(function(json) {
    svg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", "#ccc")
        .attr("stroke", "#333")
        .attr("stroke-width", "0.5px")

        // mouseover should show pop-up infobox
        .on("mouseover", function(event, d) {
            d3.select(this).style("fill", "pink");
        })
        .on("mouseout", function(event, d) {
            d3.select(this).style("fill", "#ccc");
        });
}).catch(function (error) {
    console.error("Error while loading or parsing data:", error);
});
