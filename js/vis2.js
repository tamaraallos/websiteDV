// height, width, padding setup
var w = 1000;
var h = 800;
var padding = 50;

// color scale
var color = d3.scaleOrdinal(d3.schemeCategory10);

// scales
var xScale = d3.scaleBand()
    .range([padding, w - padding])
    .paddingInner(0.3) // space between the bars
    .paddingOuter(0.2) // space for the axis

var yScale = d3.scaleLinear()
    .range([h - padding, padding]);

// svg creation
svg = d3.select("body")
    .append("svg")
    .attr("width", w)
    .attr("height", h)

// axes
var xAxisGroup = svg.append("g")
    .attr("transform", `translate(0,${h - padding})`);

var yAxisGroup = svg.append("g")
    .attr("transform", `translate(${padding},0)`);


// load the data
d3.csv("all-top-level-causes.csv").then(function(data) {
    // extract unique causes and countries via sets
    var causes = Array.from(new Set(data.map(d => d.Cause)));
    var countries = Array.from(new Set(data.map(d => d.Country)));
    
    var dropdown = d3.select("body").append("select")
        .on("change", function() {
            var selectedCountry = this.value;
            updateTitle(selectedCountry)
            createGraph(data, causes, selectedCountry);
        })
    
    dropdown.selectAll("option")
        .data(countries)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    var defaultCountry = countries[0]; // australia
    updateTitle(defaultCountry)
    dropdown.property("value", defaultCountry)

    // create the graph
    createGraph(data, causes, defaultCountry);
});

// function to update the title of page by country chosen
function updateTitle(country) {
    d3.select("#chart-title")
        .text(`${country}'s Mortality Causes Over Time`)
        .style("text-align", "center")
}

// tool tip - styles (pop-up box)
var tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background-color", "#fcfcf9")
    .style("border", "solid 1px black")
    .style("padding", "10px")
    .style("border-radius", "3px")
    .style("visibility", "hidden");  // hide tool tip

// create the graph
function createGraph(data, causes, country) {
    var countryData = data.filter(d => d.Country === country);
    
    // group years into decades
    var decadeData = Array.from(d3.rollup(
        countryData,
        values => {
            var decade = Math.floor(values[0].Year / 10) * 10;
            var obj = { Decade: `${decade}s` };
            causes.forEach(cause => {
                obj[cause] = d3.sum(values.filter(d => d.Cause === cause), d => d.Value);
            });
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

    // select existing bars
    var groups = svg.selectAll("g.stack-group")
        .data(series);
    
    groups.exit().remove(); // remove old elements

    var newGroups = groups.enter()
        .append("g")
        .classed("stack-group", true)
        .style("fill", (d, i) => color(i))

    var bars = newGroups.merge(groups)
        .selectAll("rect")
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
        })
        .on("mouseout", function() {
            tooltip.style("visibility", 'hidden');
        });

    // update axes
    xAxisGroup.call(d3.axisBottom(xScale))
        .selectAll("text") 
        // .attr("transform", "rotate(-50)") // turn the labels on the x-axis
        // .style("text-anchor", "end"); // uncomment if u uncomment above

    yAxisGroup.call(d3.axisLeft(yScale));

}



