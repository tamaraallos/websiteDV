// Define constants
// Dimensions
const WIDTH = 960;
const HEIGHT = 960;
const LINE_MARGIN = {top: 20, right: 30, bottom: 40, left:50};
const LINE_WIDTH = 500 - LINE_MARGIN.left - LINE_MARGIN.right;
const LINE_HEIGHT = 300 - LINE_MARGIN.top - LINE_MARGIN.bottom;

// Colour and stroke
const COLOUR_DEFAULT = "#666420";
const COLOUR_HIGHLIGHT = "#420666";
const COLOUR_EMPTY = "#808080"; // "empty" is not descriptive. "no value" is.
const COLOUR_MALE = "#ffaaee";
const COLOUR_FEMALE = "#eeffaa";
const COLOUR_FRAME = "#CCCCCCCC"; // 8-digit hex, incl. opacity
const WIDTH_DEFAULT = "0.5px";
const WIDTH_HIGHLIGHT = "0.8px";

// Global variables
let allData = [];
let colourFlag = false;
let cause, year, country, sex, rangeYears;


// Set up D3 elements
// Set up SVG canvas
let svg = d3.select("#choropleth")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

// Set up map projection
let projection = d3.geoMercator()
    .center([0, 0])
    .translate([WIDTH / 2, HEIGHT / 2])
    .scale(150);

let path = d3.geoPath(projection);

// Set initial colour range
let colour = d3.scaleSequential(d3.interpolatePurples);

// Create pop-up element for line chart
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


// TODO: func filterdata ({attributes}) or however for both choro and line filtering

// Filter and merge CSV data and GeoJSON map /
// Render map and apply fill per value
function renderChoropleth(cause, year, sex) {
    let filteredData = allData.filter(d => d.Cause === cause && d.Year === year && d.Sex === sex); // replace with helper function so can reuse for line chart
    let dataMap = new Map();
    filteredData.forEach(d => dataMap.set(d.Country, d.Value));

    // Set colour domain from new category values
    colour.domain(d3.extent(filteredData, d => d.Value));

    // Read in GeoJSON file, merge data, and render map
    d3.json("../resources/world.geojson").then(function(json) {
        json.features.forEach(feature => {
            feature.properties.value = dataMap.get(feature.properties.name) || null;
        });

        // Create path elements
        svg.selectAll("path")
            .data(json.features)
            .join("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("fill", d => d.properties.value ? colour(d.properties.value) : COLOUR_EMPTY)
            .attr("stroke", COLOUR_DEFAULT)
            .attr("stroke-width", WIDTH_DEFAULT)
            .on("mouseover", function(event, d) {
                handleMouseOver.bind(this)(event, d); // bind 'this' before passing to handler
            })
            .on("mouseout", function() {
                handleMouseOut.bind(this)();
            });
    }).catch(error => console.error("Error while loading GeoJSON data:", error));
}

// Add highlight and pop-up line chart on hovering a country
function handleMouseOver(event, d) {
    d3.select(this).style("stroke", COLOUR_HIGHLIGHT)
        .style("stroke-width", WIDTH_HIGHLIGHT);

    let popupX = event.pageX + 15; // offset right
    let popupY = event.pageY + 15; // offset below

    // Prevent element clipping out of window
    if (popupX + LINE_WIDTH > window.innerWidth) {
        popupX = event.pageX - LINE_WIDTH - 15; // offset left if would clip right
    }

    if (popupY + LINE_HEIGHT > window.innerHeight) {
        popupY = event.pageY - LINE_HEIGHT - 15; //offset above if would clip below
    }

    // Set frame position
    popup.style("left", `${popupX}px`)
            .style("top", `${popupY}px`)
            .style("display", "block");

    country = d.properties.name;
    lineChart(cause, country);
}

// Remove highlight and pop-up on mouseout
function handleMouseOut() {
    d3.select(this).style("stroke", COLOUR_DEFAULT)
        .style("stroke-width", WIDTH_DEFAULT);
    country = ""; // is this necessary anymore?
    popup.style("display", "none");
    popup.select("svg").remove();
}

// Filters data by cause and country, then sex, then shows values for all years in a pop-up line chart
function lineChart(cause, country) {
    if (!country) return;

    // Filter data to get correct country, cause
    let filteredLineData = allData.filter(d => d.Cause === cause && d.Country === country); // swap w helper func
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
                        .scale(xScaleLine);
    
    let yAxisLine = d3.axisLeft()
                        .scale(yScaleLine);

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
            .attr("stroke-width", 1.5) // should be a const
            .attr("d", lineMarker);

    svgLine.append("path")
            .datum(femaleData)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", COLOUR_FEMALE)
            .attr("stroke-width", 1.5) // const
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

// Takes the set of causes and creates a select menu with an option for each
function createCauses(uniqueCauses) {
    // Add label
    d3.select("#causes")
        .append("label")
        .attr("for", "cause-select")
        .text("Cause: ");

    // Add select element
    let select = d3.select("#causes")
                    .append("select")
                    .attr("id", "cause-select");

    // Bind options to select element
    select.selectAll("option")
            .data(uniqueCauses)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

    cause = uniqueCauses[0]; // default to first value
    
    // Update choropleth and line chart on change
    select.on("change", function() {
        cause = this.value;
        renderChoropleth(cause, year, sex);
        lineChart(cause, country);
    });
}

// Takes the set of sexes and creates a select menu with an option for each
function createSexes(sexes) {
    // Add label
    d3.select("#sex")
        .append("label")
        .attr("for", "sex-select")
        .text("Sex: ");

    // Add select element
    let select = d3.select("#sex")
        .append("select")
        .attr("id", "sex-select");

    // Bind options to select element
    select.selectAll("option")
        .data(sexes)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    sex = sexes[0]; // default to first value
    
    // Update choropleth on change
    select.on("change", function() {
        sex = this.value;
        renderChoropleth(cause, year, sex);
    });
}

// Takes array of [min, max] year and creates a slider.
function createYears(rangeYears) {
    let yearDiv = d3.select("#years");

    // Add label
    let yearLabel = yearDiv.append("label")
        .attr("id", "year-label")
        .text(`Year: ${rangeYears[0]}`); // default to min year

    // Add slider element
    let slider = yearDiv.append("input")
        .attr("id", "year-slider")
        .attr("type", "range")
        .attr("min", rangeYears[0])
        .attr("max", rangeYears[1])
        .attr("value", rangeYears[0]) // default to min year
        .attr("step", 1);

    year = rangeYears[0]; // default to min year

    // Update label and choropleth on change
    slider.on("input", function() {
        year = +this.value; // slider returns str, convert to num
        yearLabel.text(`Year: ${year}`);
        renderChoropleth(cause, year, sex);
    });
}


// Event listeners for user input
d3.select("body").on("keydown", function(event) {
    switch (event.key) {
        case "c":
            changeCause();
            break;
        case "f": // f for fill obviously
            changeColour();
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

// Updates choropleth and line chart by iterating through the set of causes, in order
function changeCause() {
    let causeSelect = d3.select("#cause-select").node();

    // Get current and next index then update
    let currentIndex = causeSelect.selectedIndex;
    let nextIndex = (currentIndex + 1) % causeSelect.options.length; // loops back to first pos
    causeSelect.selectedIndex = nextIndex;

    cause = causeSelect.options[nextIndex].value; // get value for new cause

    // Update choro and line
    renderChoropleth(cause, year, sex);
    lineChart(cause, country);
}

// TODO: ternary
// Toggles between primary and alternate colour palette
function changeColour() {
    colourFlag = !colourFlag;
    if (colourFlag) {
        colour = d3.scaleSequential(d3.interpolateGreens);
    } else {
        colour = d3.scaleSequential(d3.interpolatePurples);
    }
    renderChoropleth(cause, year, sex);
}

function changeSex() {
    let sexSelect = d3.select("#sex-select").node();

    // Get current and next index, then update value
    let currentIndex = sexSelect.selectedIndex;
    let nextIndex = (currentIndex + 1) % sexSelect.options.length;
    sexSelect.selectedIndex = nextIndex;
    sex = sexSelect.options[nextIndex].value;

    // Update choro
    renderChoropleth(cause, year, sex);
}

// Changes year if new year is not out of range, updates slider, label, and choropleth
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


// Read in data from specified file, call setup functions, render initial choropleth
d3.csv("../data/causes/all-top-level-causes.csv").then(function(data) {
    // Convert str to num
    data.forEach(d => {
        d.Value = +d.Value;
        d.Year = +d.Year;
    });

    // Store all data in global variable
    allData = data;

    // Get set of causes and create select menu
    let uniqueCauses = Array.from(new Set(allData.map(d => d.Cause)));
    createCauses(uniqueCauses);

    // Get set of sexes and create select menu
    let sexes = Array.from(new Set(allData.map(d => d.Sex)));
    createSexes(sexes);

    // Get range of years and create slider
    rangeYears = d3.extent(allData, d => d.Year);
    createYears(rangeYears);

    // Render initial view with default options
    renderChoropleth(cause, year, sex);
}).catch(error => console.error("Error fetching CSV data: ", error));
