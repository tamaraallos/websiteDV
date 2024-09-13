// height, width, padding setup
var w = 1000;
var h = 800;
var padding = 100;

// color scale
var color = d3.scaleOrdinal(d3.schemeCategory10);

// scales
var xScale = d3.scaleBand()
    .range([padding, w - padding])
    .paddingInner(0.3) // space between the bars
    .paddingOuter(0.2) // space for the axis

var yScale = d3.scaleLinear()
    .range([h - padding, padding])

// svg creation
svg = d3.select("#chart")
    .append("svg")
    .attr("width", w)
    .attr("height", h)

// axes
var xAxisGroup = svg.append("g")
    .attr("transform", `translate(0,${h - padding})`);

var yAxisGroup = svg.append("g")
    .attr("transform", `translate(${padding},0)`);

// tool tip - styles (pop-up box)
var tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background-color", "#fcfcf9")
    .style("border", "solid 1px black")
    .style("padding", "10px")
    .style("border-radius", "3px")
    .style("visibility", "hidden");  // hide tool tip    

// load the data
d3.csv("all-top-level-causes.csv").then(function(data) {
    // filter out the 'Total' sex data
    var filteredData = data.filter(d => d.Sex !== "Total");

    // extract unique causes and countries via sets
    var causes = Array.from(new Set(filteredData.map(d => d.Cause)));
    var countries = Array.from(new Set(filteredData.map(d => d.Country)));
    
    var dropdown = d3.select("#countryContainer").append("select")
        .attr("id", "countryDropdown")
        .on("change", function() {
            var selectedCountry = this.value;
            updateTitle(selectedCountry)
            createGraph(filteredData, causes, selectedCountry, d3.select("#sexDropdown").property("value"));
        })
    
    dropdown.selectAll("option")
        .data(countries)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);
    
    var sexDropDown = d3.select('#sexContainer').append("select")
        .attr("id", "sexDropdown")
        .on("change", function() {
            var selectedSex = this.value;
            createGraph(filteredData, causes, d3.select("#countryDropdown").property("value"), selectedSex);
        })

    sexDropDown.selectAll("option")
        .data(["Female", "Male", "Total"]) // only genders options we need
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);
    

    var defaultCountry = countries[0]; // australia
    var defaultSex = "Total" // show total initally
    updateTitle(defaultCountry)
    dropdown.property("value", defaultCountry)
    sexDropDown.property("value", defaultSex)

    // create the graph
    createGraph(filteredData, causes, defaultCountry, defaultSex);
    axisLabels()
});

// function to update the title of page by country chosen
function updateTitle(country) {
    d3.select("#chart-title")
        .text(`${country}'s Mortality Causes Over Time`)
        .style("text-align", "center")
}

// create the graph
function createGraph(data, causes, country, sex) {
    var countryData = data.filter(d => d.Country === country && (d.Sex === sex || sex === "Total"));
    
    // group years into decades
    var decadeData = Array.from(d3.rollup(
        countryData,
        values => {
            var decade = Math.floor(values[0].Year / 10) * 10;
            var obj = { Decade: `${decade}s` };
            causes.forEach(cause => {
                obj[cause] = d3.sum(
                    values.filter(d => d.Cause === cause && d.Sex != "Total"),
                    d => d.Value
                );
            })
            return obj;
        },
        d => Math.floor(d.Year / 10) * 10  // group by decade
    ), ([key, value]) => value);

    // sort decades (this sorts it from the oldest time to newer time)
    decadeData.sort((a, b) => parseInt(a.Decade) - (parseInt(b.Decade)));

    // create stack
    var stack = d3.stack()
        .keys(causes);
    var series = stack(decadeData); // stack data

    // update scales
    xScale.domain(decadeData.map(d => d.Decade));
    yScale.domain([0, d3.max(decadeData, d => d3.sum(causes, cause => d[cause]))]);

    // select existing bars and update stack
    var groups = svg.selectAll("g.stack-group")
        .data(series);
    
    groups.exit().remove(); // remove old elements

    var newGroups = groups.enter()
        .append("g")
        .classed("stack-group", true)
        .style("fill", (d, i) => color(i))

    // create bars within each stack group
    var bars = newGroups.merge(groups).selectAll("rect")
        .data(d => d)

    bars.exit().remove(); // remove old bars

    bars.enter()
        .append("rect")
        .merge(bars)
        .attr("x", d => xScale(d.data.Decade))
        .attr("y", d => yScale(d[1]))
        .attr("height", d => yScale(d[0]) - yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .on("mouseover", function(event, d) {
            var cause = d3.select(this.parentNode).datum().key;
            var valueDeaths = Math.floor(d[1] - d[0]);

            tooltip.html("Causes " + cause + "<br>Value: " + valueDeaths + ' unitOfMeasure')
                .style("visibility", "visible")
                .style("left", (event.pageX + 15) + "px") // right of cursor (x-axis)
                .style("top", (event.pageY - 50) + "px"); // above cursor (y-axis)

                var currentColor = d3.select(this).style("fill");

                d3.select(this)
                .transition()
                .duration(150)
                .attr("stroke", currentColor)
                .attr("stroke-width", 2)

        })
        .on("mouseout", function() {
            d3.select(this)
                .transition()
                .duration(150)
                .attr("stroke", "none")
                .attr("stroke-width", 0)

            tooltip.style("visibility", 'hidden');
        });

    // update axes and create legend
    updateScales();
    createLegend(causes)
}

// updates the y and x axis scales
function updateScales() {
    xAxisGroup.call(d3.axisBottom(xScale))
        .selectAll("text") 

    yAxisGroup.call(d3.axisLeft(yScale));
}

// labels for x and y axis
function axisLabels() {
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", w / 2) 
        .attr("y", h - padding + 70)
        .text("Years (in decades)");

    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", - (h / 2)) 
        .attr("y", padding - 70) 
        .attr("transform", "rotate(-90)") // rotate to side
        .text("Death Billion");
}


function createLegend(causes) {
    var legendContainer = d3.select("#legendContainer");
    legendContainer.selectAll(".legend-item").remove(); // clear existing legend items so they dont pile up

    causes.forEach((cause, i) => {
        var legendItem = legendContainer.append("div")
            .attr("class", "legend-item");

        legendItem.append("div")
            .attr("class", "legend-color-box")
            .style("background-color", color(i));  // use the color scale

        legendItem.append("span")
            .attr("class", "legend-label")
            .text(cause);  // display the cause
    });
}

