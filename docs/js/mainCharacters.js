class MainCharacters {
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      //containerWidth: 700,
      containerHeight: 400,
      // contextHeight: 30,
      margin: {top: 25, right: 20, bottom: 50, left: 50},
      // contextMargin: {top: 300, right: 20, bottom: 20, left: 50},
      tooltipPadding: 15
    }
    this.data = _data;
    this.selectedSeason = "0"; // Default to all seasons
    this.initVis();
  }

  initVis() {
    let vis = this;
    vis.config.containerWidth = document.getElementById(vis.config.parentElement.substring(1)).clientWidth;
    //vis.config.containerHeight = document.getElementById(vis.config.parentElement.substring(1)).clientHeight;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0]) 

    vis.xScale = d3.scaleBand()
        .range([0, vis.width])
        .paddingInner(0.2);

    vis.xAxis = d3.axisBottom(vis.xScale)
        .tickSizeOuter(0);

    vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(6)
        .tickSizeOuter(0);

    vis.tempData = vis.data;
    // Now for each character
    vis.tempData.forEach(d => {
      ["1", "2", "3"].forEach(season => {
        d[`s${season}_lines`] = Object.keys(d)
          .filter(key => key.startsWith(season) && key.endsWith("lines"))
          .reduce((sum, key) => sum + (+d[key] || 0), 0);
        d[`s${season}_words`] = Object.keys(d)
          .filter(key => key.startsWith(season) && key.endsWith("words"))
          .reduce((sum, key) => sum + (+d[key] || 0), 0);
      });
    });
    let episodeNames = Object.keys(vis.tempData[0]).filter(d => d !== "name" && !d.endsWith("words"))
    episodeNames = episodeNames.map(x => x.slice(0, -6));
    vis.newData = episodeNames.map(episode => {
      const obj = { episode: episode };
      vis.tempData.forEach(character => {
        obj[character.name + "_lines"] = +character[episode + "_lines"] || 0;  // or 0 if missing
        obj[character.name + "_words"] = +character[episode + "_words"] || 0;  // or 0 if missing
      });
      return obj;
    });
    //console.log(vis.filteredData);

    vis.seasonSelect = d3.select('#season-selector');
    vis.selectedSeason = "0";
    //vis.selectedEpisode = "All Episodes";
    vis.seasonSelect.on('change', (event) => {
      vis.selectedSeason = d3.select(event.target).property("value");
      //vis.selectedEpisode = "All Episodes";
      vis.updateVis();
    });

    vis.lineSelect = d3.select('#line-selector');
    vis.selectedDenomination = "lines";
    vis.lineSelect.on('change', (event) => {
      vis.selectedDenomination = d3.select(event.target).property("value");
      vis.updateVis();
    });

    vis.svg = d3.select("#presence-chart svg")
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // SVG Group containing the actual chart; D3 margin convention
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);
    
    // Append y-axis group 
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');
  }

  updateVis() {
    let vis = this;

    vis.filteredData = vis.newData;

    vis.stack = d3.stack()
        .keys(vis.selectedDenomination == "lines" ? ["rick_lines", "morty_lines", "jerry_lines", "beth_lines", "summer_lines"] : 
          ["rick_words", "morty_words", "jerry_words", "beth_words", "summer_words"]);

    // Specificy x- and y-accessor functions
    //console.log(d => d.name);
    //vis.xValue = d => d.episode;
    //vis.yValue = d => +d.all_lines;

    if (vis.selectedSeason == "0") {
      vis.filteredData = vis.filteredData.filter(x => x.episode.startsWith("s"));
      //vis.yValue = d => +d["s" + vis.selectedSeason + "_" + vis.selectedDenomination];
    }
    else {
      vis.filteredData = vis.filteredData.filter(x => x.episode.startsWith(vis.selectedSeason));
      //vis.yValue = d => +d["s" + vis.selectedSeason + "_" + vis.selectedDenomination];
    }
    //console.log(vis.filteredData);

    let maxValue = 0;
    vis.filteredData.forEach(x => {
      let sum = x["rick_" + vis.selectedDenomination] + x["morty_" + vis.selectedDenomination] + 
      x["jerry_" + vis.selectedDenomination] + x["beth_" + vis.selectedDenomination] + x["summer_" + vis.selectedDenomination];
      maxValue = Math.max(maxValue, sum); 
    });
    //console.log(maxValue);


    // Set the scale input domains
    vis.xScale.domain(vis.filteredData.map(x => x.episode));
    //vis.yScale.domain([0, d3.max(vis.filteredData, vis.yValue)]);
    vis.yScale.domain([0,maxValue]);

    vis.stackedData = vis.stack(vis.filteredData);
    console.log(vis.stackedData);
    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    vis.chart.selectAll('.category')
        .data(vis.stackedData)
      .join('g')
        .attr('class', d => `category cat-${d.key}`)
      .selectAll('rect')
        .data(d => d)
      .join('rect')
        .attr('x', d => vis.xScale(d.data.episode))
        .attr('y', d => vis.yScale(+d[1]))
        .attr('height', d => vis.yScale(+d[0]) - vis.yScale(+d[1]))
        .attr('width', vis.xScale.bandwidth());

    // Update axes
    vis.xAxisG
        .transition().duration(1000)
        .call(vis.xAxis);

    vis.yAxisG.call(vis.yAxis);
  }
}