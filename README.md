# Global Mortality Visualisation Project

## Introduction
This project visualises mortality rates across various regions and over time, focusing on the proportional changes in the causes of mortality over the past sixty years. The projects goal is to provide an interactive, inutitve and friendly experience that allows users to explore the leading causes of death and how they
differ by region, gender and over time.

The data for this project comes from the OECD and includes cause specific mortality rates for different countries. The aim is to answer the research question **How have the proportional rates of various causes of mortality changed over the past sixty years?**

## Visualisations
The project includes two main visualisations:

### 1. **Choropleth Map with Time series**
This interactive choropleth map shows the mortality rates of different causes across countries.
- **Interaction:** When a user hovers over a country, a time series graph appears, displaying the change in mortality rates for that country over time.
- **Filters:** Users can filter data by year to focus on a specific time period. 

### 2.  **Stacked Bar Chart**
The stacked bar chart displays the mortality rates for selected causes of death in a specific country.
- **Interaction:** Users can filter the data by country, gender, and specific causes of mortality. If users hover over a segment of the bar then a tooltip will pop up showing more information.
- **Dynamic Changes:** Selecting or deselecting different causes of death updates the stacked bar chart
and the title to reflect the current selection. 

## Features

- **Interactive Filtering:** Users can filter by country, gender, time period and causes of mortality to gain a deeper insight.
- **Hover-to-View:** Hovering over a country on the map reveals a time series graph of that country's mortality data for that specific year. A tooltip on the stacked bar chart is revealed. As a result, users are able to explore causes of mortality.
- **Data Exploration:** Both visuals allow users to explore data trends over time, by gender, and by country, helping researchers and policymakers make informed decisions. 

## Purpose
This project is designed to help:
- **Researchers:** Identify patterns in global mortality rates and explore causes related to lifestyles.
- **Healthcare Providers:** Analyse gender differences in healthcare treatment, access and causes.
- **Policymakers:** Allocate resources by understanding regional and gender specific health challenges more effectively.

By visualising complex mortality rates, we hope to raise awareness, support public health initiatives, and hep fight causes of death that are preventable.

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Data Visualization**: D3.js
- **Data Source**: OECD Mortality Data

## How to Run
1. Clone the repository
2. Open `index.html` in your browser to explore the visulisations

## Project Information
This project was developed as part of COS30045 for Data Visualisation assignment 3C. It focuses on exploring and visualising global mortality data using Javascripts D3 library and visualisaiton techniques such as implementing Muzner's guidelines and Tufte's design principles.
