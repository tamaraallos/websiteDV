// height, width, padding setup
var w = 1000;
var h = 800;
var padding = 100;

// selected country and sex
var selectedCountry = "";
var selectedSex = "Total"; // default value  

// initalise causes
var selectedCauses = {}; // keep track of selected
var causes = [];

// color mapping each cause has its own color
var colorMapping = {
    "Certain infectious and parasitic diseases": "#1f77b4",
    "Mental and behavioural disorders": "#ff7f0e",
    "Neoplasms": "#2ca02c",
    "Congenital malformations, deformations and chromosomal abnormalities": "#d62728",
    "Diseases of the skin and subcutaneous tissue": "#9467bd",
    "Diseases of the respiratory system": "#8c564b",
    "Diseases of the digestive system": "#e377c2",
    "External causes of mortality": "#7f7f7f",
    "Diseases of the nervous system": "#bcbd22",
    "Symptoms, signs, ill-defined causes": "#17becf",
    "Diseases of the circulatory system": "#ff6f61",
    "Certain conditions originating in the perinatal period": "#6b5b95",
    "Codes for special purposes: COVID-19": "#feb236",
    "Endocrine, nutritional and metabolic diseases": "#d96459",
    "Diseases of the blood and blood-forming organs": "#f8c471",
    "Diseases of the genitourinary system": "#c4e17f",
    "Diseases of the musculoskeletal system and connective tissue": "#9b59b6",
    "Pregnancy, childbirth and the puerperium": "#b070a1"
};

// returns corresponding color for given cause
var color = function(cause) {
    return colorMapping[cause];
}   

// resets causes and legend opacity when users change filter
function resetLegend(causes) {
    causes.forEach(cause => {
        selectedCauses[cause] = true; // all causes selected by default
    });
    
    // for each legend item reset style
    d3.selectAll(".legend-item").each(function() {
        d3.select(this).select(".legend-color-box")
            .style("opacity", 1);

        d3.select(this).select(".legend-label")
            .style("opacity", 1)
            .style("text-decoration", "none");
    });
}

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
    .style("background-color", "#420420")
    .style("border", "solid 1px #e4e4e4")
    .style("padding", "10px")
    .style("border-radius", "3px")
    .style("visibility", "hidden");  // hide tool tip    

// load the data
d3.csv("/data/all-top-level-causes.csv").then(function(data) {
    // filter out the 'Total' sex data
    var filteredData = data.filter(d => d.Sex !== "Total");

    // extract unique causes and countries via sets
    causes = Array.from(new Set(filteredData.map(d => d.Cause)));
    var countries = Array.from(new Set(filteredData.map(d => d.Country)));

    // initalise selectedCauses to include all causes
    causes.forEach(cause => {
        selectedCauses[cause] = true; // all causes selected by default
    });
    
    var dropdown = d3.select("#countryContainer").append("select")
        .attr("id", "countryDropdown")
        .on("change", function() {
            selectedCountry = this.value;
            resetLegend(causes);
            updateTitle(selectedCountry, selectedSex);
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
            selectedSex = this.value;
            resetLegend(causes);
            updateTitle(selectedCountry, selectedSex);
            createGraph(filteredData, causes, d3.select("#countryDropdown").property("value"), selectedSex);
        })

    sexDropDown.selectAll("option")
        .data(["Female", "Male", "Total"]) // only genders options we need
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);
    
    // set default values    
    selectedCountry = countries[0]; // australia
    dropdown.property("value", selectedCountry)
    sexDropDown.property("value", selectedSex)

    // initial title update
    updateTitle(selectedCountry, selectedSex);

    // create the graph
    createGraph(filteredData, causes, selectedCountry, selectedSex);

    // create legend
    createLegend(filteredData, causes, selectedCountry, selectedSex)
    axisLabels()
});


// function to update the title and subtitle of page by filters chosen
function updateTitle(country, sex) {
    d3.select("#chart-title")
        .text(`${country}'s Mortality Causes Over Time (${sex})`)
        .style("text-align", "center")
        
    var activeCauses = Object.keys(selectedCauses).filter(cause => selectedCauses[cause]);

    var subtitle;
    // checks length of active causes, and modifies subtitle based on results
    if (activeCauses.length === 0) {
        subtitle = 'No Causes Selected';
    } else if (activeCauses.length === causes.length) {
        subtitle = 'By all causes';
    } else {
        var displayCauses = activeCauses.slice(0, 3) // get first 3 causes
        var otherCount = activeCauses.length - displayCauses.length;
        subtitle = `${displayCauses.join(", ")}${otherCount > 0 ? `, and ${otherCount} other cause${otherCount > 1 ? 's' : ''}` : ''}`
    }
    d3.select("#chart-subtitle")
        .text(subtitle)
        .style("text-align", "center");
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
        .style("fill", d => color(d.key));

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
        .style("fill", (d, i, nodes) => {
            var cause = d3.select(nodes[i].parentNode).datum().key;
            return color(cause);
        })
        .on("mouseover", function(event, d) {
            var cause = d3.select(this.parentNode).datum().key;
            var valueDeaths = Math.floor(d[1] - d[0]);

            tooltip.html("Causes " + cause + "<br>Value: " + valueDeaths + ' deaths per 100,000 inhabitants')
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
        .style("fill", "white")
        .text("Years (in decades)");

    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", - (h / 2)) 
        .attr("y", padding - 70) 
        .attr("transform", "rotate(-90)") // rotate to side
        .style("fill", "white")
        .text("Deaths per 100,000 Inhabitants");
}

// creates the legend and toggles visibility for different causes 
function createLegend(filteredData, causes, country, sex) {
    var legendContainer = d3.select("#legendContainer");
    
    // create legend item for each cause
    causes.forEach(cause => {
        var legendItem = legendContainer.append("div")
            .attr("class", "legend-item")
            .style("cursor", "pointer")
            .on("click", function() {
                // toggle selection state
                selectedCauses[cause] = !selectedCauses[cause];

                // filter active causes based on selection state
                var activeCauses = causes.filter(c => selectedCauses[c]);
                createGraph(filteredData, activeCauses, country, sex);
                updateTitle(country, sex);

                // style changes to the items on legend to show toggle
                var opacity = selectedCauses[cause] ? 1 : 0.5;
                d3.select(this).select(".legend-color-box")
                    .style("opacity", opacity);
                
                d3.select(this).select(".legend-label")
                    .style("opacity", opacity)
                    .style("text-decoration", selectedCauses[cause] ? "none" : "line-through");
            });

        // append color box to legend item    
        legendItem.append("div")
            .attr("class", "legend-color-box")
            .style("background-color", color(cause))
            .style("opacity", 1);

        // append label to legend item
        legendItem.append("span")
            .attr("class", "legend-label")
            .style("color", "white") 
            .style("text-decoration", "none") 
            .text(cause); // display the cause
    });
}