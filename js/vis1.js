// Define constants
const WIDTH = 960;
const HEIGHT = 960;

const COLOUR_DEFAULT = "#666420";
const COLOUR_HIGHLIGHT = "#420666";
const COLOUR_EMPTY = "#808080";

const WIDTH_DEFAULT = "0.5px";
const WIDTH_HIGHLIGHT = "0.8px";

const LINE_MARGIN = {top: 20, right: 30, bottom: 40, left:50};
const LINE_WIDTH = 500 - LINE_MARGIN.left - LINE_MARGIN.right;
const LINE_HEIGHT = 300 - LINE_MARGIN.top - LINE_MARGIN.bottom;

const COLOUR_MALE = "#ffaaee";
const COLOUR_FEMALE = "#eeffaa";
const COLOUR_FRAME = "#CCCCCCCC"; // 8-digit hex, incl. opacity

// Default chart options
let cause, year, country;
let sex = "Total";

let rangeYears;

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
            .on("mouseover", function(event, d) {
                d3.select(this).style("stroke", COLOUR_HIGHLIGHT)
                    .style("stroke-width", WIDTH_HIGHLIGHT);

                // get dimensions of window
                let viewWidth = window.innerWidth;
                let viewHeight = window.innerHeight;
                console.log(`${viewWidth}, ${viewHeight}`);

                // default pos
                let popupX = event.pageX + 15; // offset right
                let popupY = event.pageY + 15; // offset below

                // check for cropping
                if (popupX + LINE_WIDTH > viewWidth) {
                    console.log("crop right");
                    popupX = event.pageX - LINE_WIDTH - 15; // offset left if would clip right
                }

                if (popupY + LINE_HEIGHT > viewHeight) {
                    console.log("crop bot");
                    popupY = event.pageY - LINE_HEIGHT - 15; //offset above if would clip below
                }
                
                // Set frame pos and offset from cursor and make visible
                popup.style("left", `${popupX}px`)
                        .style("top", `${popupY}px`)
                        .style("display", "block");

                country = d.properties.name;
                lineChart(cause, country);
            })
            .on("mouseout", function(event, d) {
                d3.select(this).style("stroke", COLOUR_DEFAULT)
                    .style("stroke-width", WIDTH_DEFAULT);
                country = "";
                // hide popup frame
                popup.style("display", "none");
                popup.select("svg").remove();
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
        lineChart(cause, country);
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
                        .attr("id", "year-slider")
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
// Create pop-up element
let popup = d3.select("body")
                .append("div")
                .attr("id", "line-chart")
                .style("position", "absolute")
                .style("display", "none") // start hidden
                .style("background-color", COLOUR_FRAME)
                .style("border", `1px solid ${COLOUR_HIGHLIGHT}`)
                .style("padding", "10px")
                .style("border-radius", "5px")
                .style("pointer-events", "none"); // prevent frame blocking country change

function lineChart(cause, country) {
    if (!country) return;

    // Filter data to get correct country, cause
    let filteredLineData = allData.filter(d => d.Cause === cause && d.Country === country);
    let maleData = filteredLineData.filter(d => d.Sex === "Male");
    let femaleData = filteredLineData.filter(d => d.Sex === "Female");

    // Sort chronologically to get rid of line
    maleData.sort((a, b) => a.Year - b.Year);
    femaleData.sort((a, b) => a.Year - b.Year);

    // debugging: check filtered data exists
    if (maleData.length === 0 && femaleData.length === 0) {
        console.warn(`no data for country: ${country}; cause: ${cause}`);
        return;
    }
    // debugging: check both data sets for NaN or Null to find that pesky line
    console.log("Male Data:", maleData);
    console.log("Female Data:", femaleData);

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
                        .defined(d => !isNaN(d.Value)) // ignore missing data points
                        .x(d => xScaleLine(d.Year))
                        .y(d => yScaleLine(d.Value));

    // Add lines
    svgLine.append("path")
            .datum(maleData)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", COLOUR_MALE)
            .attr("stroke-width", 1.5)
            .attr("d", lineMarker);

    svgLine.append("path")
            .datum(femaleData)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", COLOUR_FEMALE)
            .attr("stroke-width", 1.5)
            .attr("d", lineMarker);

    // Add colour legend
    svgLine.append("text")
            .attr("x", LINE_WIDTH)
            .attr("y", LINE_MARGIN.top)
            .attr("fill", COLOUR_MALE)
            .attr("text-anchor", "end")
            .text("Male");

    svgLine.append("text")
            .attr("x", LINE_WIDTH)
            .attr("y", LINE_MARGIN.top + 20)
            .attr("fill", COLOUR_FEMALE)
            .attr("text-anchor", "end")
            .text("Female");

    // Add Country label
    svgLine.append("text")
            .attr("x", LINE_WIDTH)
            .attr("y", LINE_HEIGHT + LINE_MARGIN.bottom)
            .attr("fill", COLOUR_DEFAULT)
            .attr("text-anchor", "end")
            .text(country);
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
    rangeYears = d3.extent(allData, d => d.Year);
    createYears(rangeYears);

    // Render initial view with default options
    renderChoropleth(cause, year, sex);
}).catch(error => console.error("Error fetching CSV data: ", error));

// Event listener for sex select
d3.select("#sex").on("change", function() {
    sex = this.value;
    renderChoropleth(cause, year, sex);
});

// hotkeys stuff
function changeCause() {
    // get current cause
    let causeSelect = d3.select("#cause-select").node();

    // get current and next index then update
    let currentIndex = causeSelect.selectedIndex;
    let nextIndex = (currentIndex + 1) % causeSelect.options.length; // loops back to start
    causeSelect.selectedIndex = nextIndex;

    // get new cause' value
    cause = causeSelect.options[nextIndex].value;

    // update choro and line
    renderChoropleth(cause, year, sex);
    lineChart(cause, country);
}

function changeSex() {
    let sexes = ["Total", "Male", "Female"];

    // get current and next index then update
    let currentIndex = sexes.indexOf(sex);
    let nextIndex = (currentIndex + 1) % sexes.length;
    sex = sexes[nextIndex];

    // update sex menu -> should just do it same as causes but it works
    d3.select("#sex").property("value", sex);

    // update choro and line
    renderChoropleth(cause, year, sex);
}

function changeYear(direction) {
    if (!direction && year > rangeYears[0]) {
        year--;
    } else if (direction && year < rangeYears[1]) {
        year++;
    }

    d3.select("#year-slider").property("value", `${year}`);
    d3.select("#year-label").text(`Year: ${year}`);
    renderChoropleth(cause, year, sex);
}

// Listener for hotkeys
d3.select("body").on("keydown", function(event) {
    switch (event.key) {
        case "c":
            changeCause();
            break;
        case "s":
            changeSex();
            break;
        case "ArrowLeft":
            changeYear(0);
            break;
        case "ArrowRight":
            changeYear(1);
            break;
        default:
            console.log(`${event.key}`);
    }
});