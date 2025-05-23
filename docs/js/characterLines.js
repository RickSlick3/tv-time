class CharacterLines {
  constructor(_config, _data, _episodes, _images) {
    this.config = {
      parentElement: _config.parentElement,
      //containerWidth: 700,
      containerHeight: 400,
      // contextHeight: 30,
      margin: {top: 25, right: 50, bottom: 50, left: 50},
      // contextMargin: {top: 300, right: 20, bottom: 20, left: 50},
      tooltipPadding: 15
    }
    this.data = _data;
    this.episodes =  ["All Episodes", ..._episodes];
    this.images = _images;
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
        .tickFormat(d => d.split(' ')
          .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
          .join(' '))
        .tickSizeOuter(0);

    vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(6)
        .tickSizeOuter(0);

    vis.filteredData = vis.data;

    vis.seasonSelect = d3.select('#season-select');
    vis.selectedSeason = "0";
    vis.selectedEpisode = "All Episodes";
    vis.seasonSelect.on('change', (event) => {
      vis.selectedSeason = d3.select(event.target).property("value");
      vis.selectedEpisode = "All Episodes";
      vis.updateVis();
    });

    vis.episodeSelect = d3.select("#episode-select");
    vis.episodeSelect.on('change', (event) => {
      vis.selectedEpisode = d3.select(event.target).property("value");
      vis.updateVis();
    });

    vis.lineSelect = d3.select('#line-select');
    vis.selectedDenomination = "lines";
    vis.lineSelect.on('change', (event) => {
      vis.selectedDenomination = d3.select(event.target).property("value");
      vis.updateVis();
    });


    vis.svg = d3.select("#bar-chart svg")
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // SVG Group containing the actual chart; D3 margin convention
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`)
        .attr('style', 'font-size: 16px;');
    
    // Append y-axis group 
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');
  }

  updateVis() {
    let vis = this;
    console.log(vis.selectedSeason);
    console.log(vis.selectedEpisode);


    vis.filteredEpisodes = vis.episodes.filter(x => x[0] == vis.selectedSeason || x == "All Episodes" || vis.selectedSeason == "0");
    vis.episodeSelect.selectAll("option")
      .data(vis.filteredEpisodes, d => d)
      .join(
        enter => enter.append("option").text(d => d),
        update => update.text(d => d),
        exit => exit.remove())
      .attr("value", d => d);

    if (vis.selectedEpisode == "All Episodes") {
      if (vis.selectedSeason == "0") {
        vis.filteredData = vis.data.filter(x => vis.selectedDenomination == "lines" ? +x.all_lines > 50 : +x.all_words > 1000)
        .sort((a, b) => +b["all_" + vis.selectedDenomination] - +a["all_" + vis.selectedDenomination]);
        vis.yValue = d => +d["all_" + vis.selectedDenomination];
      }
      else {
        vis.filteredData = vis.data.filter(x => vis.selectedDenomination == "lines" ? 
          x["s" + vis.selectedSeason + "_" + vis.selectedDenomination] > 20 : x["s" + vis.selectedSeason + "_" + vis.selectedDenomination] > 400)
        .sort((a, b) => +b["s" + vis.selectedSeason + "_" + vis.selectedDenomination] - +a["s" + vis.selectedSeason + "_" + vis.selectedDenomination]);
        vis.yValue = d => +d["s" + vis.selectedSeason + "_" + vis.selectedDenomination];
      }
    }
    else {
      vis.filteredData = vis.data.filter(x => x[vis.selectedEpisode + "_" + vis.selectedDenomination] > 0)
      .sort((a, b) => +b[vis.selectedEpisode + "_" + vis.selectedDenomination] - +a[vis.selectedEpisode + "_" + vis.selectedDenomination]);
      vis.yValue = d => +d[vis.selectedEpisode + "_" + vis.selectedDenomination];
    }

    // Specificy x- and y-accessor functions
    //console.log(d => d.name);
    vis.xValue = d => d.name;
    //vis.yValue = d => +d.all_lines;

    // Set the scale input domains
    vis.xScale.domain(vis.filteredData.map(vis.xValue));
    vis.yScale.domain([0, d3.max(vis.filteredData, vis.yValue)]);

    // 1. Hide the normal x-axis tick labels
    //vis.xAxisG.selectAll('text').remove();

    // 2. Add custom groups at each x value
    const ticks = vis.xAxisG.selectAll('.custom-tick')
      .data(vis.filteredData, d => d);
      // .join('g')
      //   .attr('class', 'custom-tick')
      //   .attr('transform', d => `translate(${vis.xScale(d.name) + vis.xScale.bandwidth() / 2}, 10)`); // adjust Y as needed

    const ticksEnter = ticks.enter()
      .append('g')
        .attr('class', 'custom-tick')
        .attr('transform', d => `translate(${vis.xScale(d.name) + vis.xScale.bandwidth()/2}, 10)`);

    ticksEnter.merge(ticks)
      .transition().duration(500)
        .attr('transform', d => `translate(${vis.xScale(d.name) + vis.xScale.bandwidth()/2}, 10)`);

    // 3. Add image inside each tick group
    ticksEnter.append('image')
      .attr('xlink:href', d => "./data/img/" + (vis.images.find(x => x.startsWith(d.name)) ?? "placeholder.png")) // path to your image for each character
      .attr('width', vis.xScale.bandwidth() - 10)
      .attr('height', (vis.xScale.bandwidth() - 10)*1.5)
      .attr('y', 15) // on top
      .attr('x', -vis.xScale.bandwidth()/2) // center image around tick
      .attr('preserveAspectRatio', 'xMidYMid meet');

    ticks.select('image')
      .transition().duration(500)
        .attr('xlink:href', d => "./data/img/" + (vis.images.find(x => x.startsWith(d.name)) ?? "placeholder.png"));

    // 4. Add text under each image
    ticksEnter.append('text')
      .text(d => d.name)
      .attr('y', 40) // a little below the image
      .attr('text-anchor', 'middle')
      .style('font-size', '10px');

    ticks.select('text')
      .transition().duration(500)
        .text(d => d.name);

    ticks.exit().remove();

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Add rectangles
    let bars = vis.chart.selectAll('.bar')
        .data(vis.filteredData, vis.xValue)
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
            .html(`<div class="tooltip-label">Season: </div>${vis.selectedSeason == "0" ? "All" : vis.selectedSeason}
            <div class="tooltip-label">Episode: </div>${vis.selectedEpisode}
            <div class="tooltip-label">Character: </div>${d.name.split(' ')
              .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
              .join(' ')}
            <div class="tooltip-label">Number of Lines: </div>${d3.format(',')(vis.selectedEpisode == "All Episodes" ? 
              (vis.selectedSeason == "0" ? d.all_lines : d["s" + vis.selectedSeason + "_lines"]) : d[vis.selectedEpisode + "_lines"])}
            <div class="tooltip-label">Number of Words: </div>${d3.format(',')(vis.selectedEpisode == "All Episodes" ? 
              (vis.selectedSeason == "0" ? d.all_words : d["s" + vis.selectedSeason + "_words"]) : d[vis.selectedEpisode + "_words"])}
            <div class="tooltip-label">Episode Appearances in ${vis.selectedSeason == "0" ? "All Seasons" : "Season " + vis.selectedSeason}: </div> ${ 
              vis.selectedEpisode == "All Episodes" ? (vis.selectedSeason == "0" ? d.all_eps : d["s" + vis.selectedSeason + "_eps"]) : (d[vis.selectedEpisode + "_lines"] > 0 ? 1 : 0)
            }
          `)
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