// Define constants
const WIDTH = 960;
const HEIGHT = 960;
const COLOUR_DEFAULT = "#666420";
const COLOUR_HIGHLIGHT = "#420666";
const COLOUR_EMPTY = "#ccc";
const WIDTH_DEFAULT = "0.5px";
const WIDTH_HIGHLIGHT = "0.8px";

// Default chart options
let cause, year, country;
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
    let filteredData = allData.filter(d => d.Cause === cause && d.Year === year && d.Sex === sex);

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
                country = d.properties.name;
                lineChart(cause, country, sex);
            })
            .on("mouseout", function(event, d) {
                d3.select(this).style("stroke", COLOUR_DEFAULT)
                    .style("stroke-width", WIDTH_DEFAULT);
                country = "";
                d3.select("#line-chart").select("svg").remove();
            });
    }).catch(error => console.error("Error while loading GeoJSON data:", error));
}

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
        lineChart(cause, country, sex);
    });
}

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
        year = +this.value; // slider returns str, convert to num
        yearLabel.text(`Year: ${year}`);
        renderChoropleth(cause, year, sex);
    });
}

/*
  Adding line chart stuff below here.
  refactor afterwards. make it work first then make it better.
*/
// these will need better names
// also move to top with rest of constants
const LINE_MARGIN = {top: 20, right: 30, bottom: 40, left:50};
const LINE_WIDTH = 500 - LINE_MARGIN.left - LINE_MARGIN.right;
const LINE_HEIGHT = 300 - LINE_MARGIN.top - LINE_MARGIN.bottom;

function lineChart(cause, country, sex) {
    if (!country) return;

    // Filter data to get correct country, cause, and sex
    // would it be worth getting a list of all countries with data in the initial csv parsing /
    // and then checking country against that much smaller set before filtering the entire data set?
    let filteredLineData = allData.filter(d => d.Cause === cause && d.Country === country && d.Sex === sex);

    // debugging: check filtered data exists
    if (filteredLineData.length === 0) {
        console.warn(`no data for country: ${country}; cause: ${cause}; sex: ${sex}`);
        return;
    }

    // clear existing line chart
    d3.select("#line-chart").select("svg").remove();

    // Create svg element
    let svgLine = d3.select("#line-chart")
                    .append("svg")
                    .attr("width", LINE_WIDTH + LINE_MARGIN.left + LINE_MARGIN.right)
                    .attr("height", LINE_HEIGHT + LINE_MARGIN.top + LINE_MARGIN.bottom)
                    .append("g")
                    .attr("transform", `translate(${LINE_MARGIN.left}, ${LINE_MARGIN.top})`);

    // Create scales
    let xScaleLine = d3.scaleLinear()
                        .domain(d3.extent(filteredLineData, d => d.Year))
                        .range([0, LINE_WIDTH]);

    let yScaleLine = d3.scaleLinear()
                        .domain([0, d3.max(filteredLineData, d => d.Value)])
                        .range([LINE_HEIGHT, 0]);

    // debugging: country, years, max value
    console.log(`${country}; ${xScaleLine.domain()}; peak ${yScaleLine.domain()[1]}`);

    // Create axes
    let xAxisLine = d3.axisBottom()
                        .scale(xScaleLine)
                        .ticks();
    
    let yAxisLine = d3.axisLeft()
                        .scale(yScaleLine)
                        .ticks();
    // Add axes
    svgLine.append("g")
            .attr("transform", `translate(0, ${LINE_HEIGHT})`)
            .call(xAxisLine);
            
    svgLine.append("g")
            .call(yAxisLine);

    // Create line
    let lineMarker = d3.line()
                        .x(d => xScaleLine(d.Year))
                        .y(d => yScaleLine(d.Value));

    // Add line
    svgLine.append("path")
            .datum(filteredLineData)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", COLOUR_HIGHLIGHT)
            .attr("stroke-width", 1.5)
            .attr("d", lineMarker);
}

// Read in data from specified file
d3.csv("../data/causes/all-top-level-causes.csv").then(function(data) {
    // Convert str to num
    data.forEach(d => {
        d.Value = +d.Value;
        d.Year = +d.Year;
    });

    // Store all data
    allData = data;

    // create set of causes and pass set to dropdown creation function
    let uniqueCauses = Array.from(new Set(allData.map(d => d.Cause)));
    createCauses(uniqueCauses);

    // get min and max of all years and create slider
    let rangeYears = d3.extent(allData, d => d.Year);
    createYears(rangeYears);

    // Render initial view with default options
    renderChoropleth(cause, year, sex);
}).catch(error => console.error("Error fetching CSV data: ", error));

// Event listener for sex select
d3.select("#sex").on("change", function() {
    sex = this.value;
    renderChoropleth(cause, year, sex);
    lineChart(cause, country, sex); // keeping this -> cursor remains over country while user changes option with hotkeys
});
