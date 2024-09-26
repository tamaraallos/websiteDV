// Chart dimensions
const CHOROPLETH_WIDTH = 960;
const CHOROPLETH_HEIGHT = 960;
const LINE_CHART_MARGIN = {top: 20, right: 30, bottom: 40, left:50};
const LINE_CHART_WIDTH = 500 - LINE_CHART_MARGIN.left - LINE_CHART_MARGIN.right;
const LINE_CHART_HEIGHT = 300 - LINE_CHART_MARGIN.top - LINE_CHART_MARGIN.bottom;

// Colour and stroke width
const COLOUR_BORDER_DEFAULT = "#666420";
const COLOUR_BORDER_HIGHLIGHT = "#420666";
const COLOUR_NO_VALUE = "#808080";
const COLOUR_MALE = "#ffaaee";
const COLOUR_FEMALE = "#eeffaa";
const COLOUR_POPUP_FRAME = "#CCCCCCCC"; // 8-digit hex, incl. opacity
const STROKE_WIDTH_DEFAULT = "0.5px";
const STROKE_WIDTH_HIGHLIGHT = "0.8px";
const STROKE_WIDTH_LINE = "1.5px";

// Global variables
let allData = [];
let altColour = false;
let cause, year, country, sex, rangeYears;

// Set up SVG canvas
let svg = d3.select("#choropleth")
    .append("svg")
    .attr("width", CHOROPLETH_WIDTH)
    .attr("height", CHOROPLETH_HEIGHT);

// Set up map projection
let projection = d3.geoMercator()
    .center([0, 0])
    .translate([CHOROPLETH_WIDTH / 2, CHOROPLETH_HEIGHT / 2])
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
    .style("background-color", COLOUR_POPUP_FRAME)
    .style("border", `1px solid ${COLOUR_BORDER_HIGHLIGHT}`)
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("pointer-events", "none"); // prevent frame blocking country change

// Helper function for filtering data by cause, country, sex, or year
function filterData(attributes = {}) {
    let {cause, country, sex, year} = attributes;
    return allData.filter(d =>
        d.Cause === cause && // cause is only attr used in both charts, rest optional
        (!country || d.Country === country) &&
        (!sex || d.Sex === sex) &&
        (!year || d.Year === year)
    );
}

// Filter and merge CSV data and GeoJSON map, then render choropleth with scaled fill colour
function renderChoropleth() {
    let filteredData = filterData({cause, year, sex});
    let dataMap = new Map();
    filteredData.forEach(d => dataMap.set(d.Country, d.Value));

    // Set colour domain from new category values
    colour.domain(d3.extent(filteredData, d => d.Value));

    // Read in GeoJSON file, merge data, and render map
    d3.json("../resources/world.geojson").then(function(json) {
        json.features.forEach(feature => {
            feature.properties.value = dataMap.get(feature.properties.name) || null;
        });

        // Create path elements for countries
        svg.selectAll("path")
            .data(json.features)
            .join("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("fill", d => d.properties.value
                ? colour(d.properties.value)
                : COLOUR_NO_VALUE)
            .attr("stroke", COLOUR_BORDER_DEFAULT)
            .attr("stroke-width", STROKE_WIDTH_DEFAULT)
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
    d3.select(this).style("stroke", COLOUR_BORDER_HIGHLIGHT)
        .style("stroke-width", STROKE_WIDTH_HIGHLIGHT);

    let popupX = event.pageX + 15; // offset right
    let popupY = event.pageY + 15; // offset below

    // Prevent element clipping out of window
    if (popupX + LINE_CHART_WIDTH > window.innerWidth) {
        popupX = event.pageX - LINE_CHART_WIDTH - 15; // offset left if would clip right
    }

    if (popupY + LINE_CHART_HEIGHT > window.innerHeight) {
        popupY = event.pageY - LINE_CHART_HEIGHT - 15; //offset above if would clip below
    }

    // Set frame position
    popup.style("left", `${popupX}px`)
        .style("top", `${popupY}px`)
        .style("display", "block");

    country = d.properties.name;
    renderLineChart();
}

// Remove highlight and pop-up on mouseout
function handleMouseOut() {
    d3.select(this).style("stroke", COLOUR_BORDER_DEFAULT)
        .style("stroke-width", STROKE_WIDTH_DEFAULT);
    country = "";
    popup.style("display", "none");
    popup.select("svg").remove();
}

// Filters data by cause, country, sex then shows values for all years in a pop-up line chart
function renderLineChart() {
    if (!country) return;

    // Filter data to get Male and Female values
    let maleData = filterData({cause, country, sex: "Male"});
    let femaleData = filterData({cause, country, sex: "Female"});

    // Sort data chronologically to get rid of the line between first and last values
    maleData.sort((a, b) => a.Year - b.Year);
    femaleData.sort((a, b) => a.Year - b.Year);

    // Check filtered data exists else exit
    if (maleData.length === 0 && femaleData.length === 0) {
        console.warn(`no data for country: ${country}; cause: ${cause}`);
        return;
    }
    
    // Clear existing line chart
    d3.select("#line-chart").select("svg").remove();

    // Create svg element
    let svgLine = d3.select("#line-chart")
        .append("svg")
        .attr("width", LINE_CHART_WIDTH + LINE_CHART_MARGIN.left + LINE_CHART_MARGIN.right)
        .attr("height", LINE_CHART_HEIGHT + LINE_CHART_MARGIN.top + LINE_CHART_MARGIN.bottom)
        .append("g")
        .attr("transform", `translate(${LINE_CHART_MARGIN.left}, ${LINE_CHART_MARGIN.top})`);

    // Create scales
    let xScaleLine = d3.scaleLinear()
        .domain(d3.extent([...maleData, ...femaleData], d => d.Year)) // spread operator (...) concatenates the arrays
        .range([0, LINE_CHART_WIDTH]);

    let yScaleLine = d3.scaleLinear()
        .domain([0, d3.max([...maleData, ...femaleData], d => d.Value)])
        .range([LINE_CHART_HEIGHT, 0]);

    console.log(`${country}; ${xScaleLine.domain()}; peak ${yScaleLine.domain()[1]}`);

    // Create axes
    let xAxisLine = d3.axisBottom(xScaleLine);
    let yAxisLine = d3.axisLeft(yScaleLine);

    // Add axes
    svgLine.append("g")
        .attr("transform", `translate(0, ${LINE_CHART_HEIGHT})`)
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
        .attr("stroke-width", STROKE_WIDTH_LINE)
        .attr("d", lineMarker);

    svgLine.append("path")
        .datum(femaleData)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", COLOUR_FEMALE)
        .attr("stroke-width", STROKE_WIDTH_LINE)
        .attr("d", lineMarker);

    // Add colour legend
    svgLine.append("text")
        .attr("x", LINE_CHART_WIDTH)
        .attr("y", LINE_CHART_MARGIN.top)
        .attr("fill", COLOUR_MALE)
        .attr("text-anchor", "end")
        .text("Male");

    svgLine.append("text")
        .attr("x", LINE_CHART_WIDTH)
        .attr("y", LINE_CHART_MARGIN.top + 20)
        .attr("fill", COLOUR_FEMALE)
        .attr("text-anchor", "end")
        .text("Female");

    // Add Country label
    svgLine.append("text")
        .attr("x", LINE_CHART_WIDTH)
        .attr("y", LINE_CHART_HEIGHT + LINE_CHART_MARGIN.bottom)
        .attr("fill", COLOUR_BORDER_DEFAULT)
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
        renderChoropleth();
        renderLineChart();
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
        renderChoropleth();
    });
}

// Takes array of [min, max] year and creates a slider.
function createYears(rangeYears) {
    // Add label
    let yearLabel = d3.select("#years")
        .append("label")
        .attr("id", "year-label")
        .text(`Year: ${rangeYears[0]}`);

    // Add slider element
    let slider = d3.select("#years")
        .append("input")
        .attr("id", "year-slider")
        .attr("type", "range")
        .attr("min", rangeYears[0])
        .attr("max", rangeYears[1])
        .attr("value", rangeYears[0])
        .attr("step", 1);

    year = rangeYears[0]; // default to min year

    // Update label and choropleth on change
    slider.on("input", function() {
        year = +this.value; // slider returns str, convert to num
        yearLabel.text(`Year: ${year}`);
        renderChoropleth();
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
    renderChoropleth();
    renderLineChart();
}

// Toggles between primary and alternate colour palette
function changeColour() {
    altColour = !altColour;
    colour = altColour
        ? d3.scaleSequential(d3.interpolateGreens)
        : d3.scaleSequential(d3.interpolatePurples);
    renderChoropleth();
}

function changeSex() {
    let sexSelect = d3.select("#sex-select").node();

    // Get current and next index, then update value
    let currentIndex = sexSelect.selectedIndex;
    let nextIndex = (currentIndex + 1) % sexSelect.options.length;
    sexSelect.selectedIndex = nextIndex;
    sex = sexSelect.options[nextIndex].value;

    // Update choropleth
    renderChoropleth();
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
    renderChoropleth();
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
    renderChoropleth();
}).catch(error => console.error("Error fetching CSV data: ", error));
