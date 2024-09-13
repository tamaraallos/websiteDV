# websiteDV
Website Data Visualisation 

## TO DO
- background image for index, check unsplashed
- css for all pages
### Vis 1
- positioning of all option elements
- y-axis colour domain: updating the domain with the range of only the selected cause's values removes the ability to compare relative values between cauases. dark purple on one could be of lesser value than light purple on another if the latter's rate per 100k is much higher globally than the former.
- add legend for colour range
- [add secondary chart on hover](#vis-1-hover-display--line-chart)
    - is the line chart going to appear on top of the choro or separately to the side?
- Move mouseover events to separate functions
- Reduce opacity of irrelevant countries
- France is also part of South America someone should tell them
- /** docstrings
- read GeoJSON once only

#### Vis 1 hover display / Line Chart
- _When the user hovers their cursor over any country, a pop-up element will show a line chart that displays the currently selected cause's values for each year, for that country._
- ~~create line chart~~
- ~~line chart reads from same `all-causes` data~~
- ~~hover over new country updates chart country~~
- x-axis scale: highlight when domain changes, e.g. South Africa's records starting in 1996 -> other option is to hardcode 1960-2023 but yuck empty space
- hover over country shows pop-up frame
- mouseout removes pop-up frame / might be jarring when quickly moving the cursor; maybe remove the chart and add a delay to the removal of the frame so if another valid country is quickly hovered over the frame appears to stay consistent and only the chart changes.
- line chart inside pop-up frame
- line chart: filter all data once instead of each time function is called
