class CharacterLines {
  constructor(_config, _data, _episodes) {
    this.config = {
      parentElement: _config.parentElement,
      //containerWidth: 700,
      containerHeight: 400,
      // contextHeight: 30,
      margin: {top: 25, right: 20, bottom: 50, left: 50},
      // contextMargin: {top: 300, right: 20, bottom: 20, left: 50},
      // tooltipPadding: 15
    }
    this.data = _data;
    this.episodes =  ["All Episodes", ..._episodes];
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

    vis.seasonSelect = document.getElementById('season-select');
    vis.selectedSeason = "0";
    vis.seasonSelect.addEventListener('change', (event) => {
      vis.selectedSeason = event.target.value;
      vis.updateVis();
    });

    vis.episodeSelect = d3.select("#episode-select");


    vis.svg = d3.select("#bar-chart svg")
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


    vis.filteredEpisodes = vis.episodes.filter(x => x[0] == vis.selectedSeason || x == "All Episodes" || vis.selectedSeason == "0");
    vis.episodeSelect.selectAll("option")
      .data(vis.filteredEpisodes, d => d)
      .join(
        enter => enter.append("option").text(d => d),
        update => update.text(d => d),
        exit => exit.remove());

    // Specificy x- and y-accessor functions
    //console.log(d => d.name);
    vis.xValue = d => d.name;
    vis.yValue = d => +d.all_lines;

    // Set the scale input domains
    vis.xScale.domain(vis.data.map(vis.xValue));
    vis.yScale.domain([0, d3.max(vis.data, vis.yValue)]);

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Add rectangles
    let bars = vis.chart.selectAll('.bar')
        .data(vis.data, vis.xValue)
      .join('rect');
    
    bars.style('opacity', 0.5)
      .transition().duration(1000)
        .style('opacity', 1)
        .attr('class', 'bar')
        .attr('x', d => vis.xScale(vis.xValue(d)))
        .attr('width', vis.xScale.bandwidth())
        .attr('height', d => vis.height - vis.yScale(vis.yValue(d)))
        .attr('y', d => vis.yScale(vis.yValue(d)))
    
    // Tooltip event listeners
    bars
        .on('mouseover', (event,d) => {
          d3.select('#tooltip')
            .style('opacity', 1)
            // Format number with million and thousand separator
            .html(`<div class="tooltip-label">Number of Lines</div>${d3.format(',')(d.all_lines)}`);
        })
        .on('mousemove', (event) => {
          d3.select('#tooltip')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('opacity', 0);
        });

    // Update axes
    vis.xAxisG
        .transition().duration(1000)
        .call(vis.xAxis);

    vis.yAxisG.call(vis.yAxis);
  }
}