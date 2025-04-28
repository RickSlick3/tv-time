class EpisodeChart {
  constructor(_config, _data, _characters) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 600,
      containerHeight: 400,
      // contextHeight: 30,
      margin: {top: 50, right: 20, bottom: 50, left: 50},
      // contextMargin: {top: 300, right: 20, bottom: 20, left: 50},
      tooltipPadding: 15
    }
    this.data = _data;
    this.characters = _characters;
    this.initVis();
  }

  initVis() {
    let vis = this;
    //vis.config.containerWidth = document.getElementById(vis.config.parentElement.substring(1)).clientWidth;
    //vis.config.containerHeight = document.getElementById(vis.config.parentElement.substring(1)).clientHeight;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    vis.episodeWidth = 30;
    vis.episodeHeight = 30;
    vis.seasonSpacing = 20; // Space between rows

    vis.selectedCharacter = vis.characters[0];
    vis.container = d3.select(vis.config.parentElement);
    vis.charSelect = vis.container.select('#cloud-character-select');
    vis.charSelect.on('change', event => {
      vis.selectedCharacter = d3.select(event.target).property('value');
      vis.updateVis();
    });

    vis.svg = d3.select('#episode-chart')
      .append('svg')
      .attr('width', vis.width + vis.config.margin.left + vis.config.margin.right)
      .attr('height', vis.height + vis.config.margin.top + vis.config.margin.bottom)
      .append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.xScale = d3.scaleBand()
      //.domain(d3.range(1, 11 + 1)) // Max Episode + 1
      .range([0, vis.width])
      .padding(0.05);
    
    vis.yScale = d3.scaleBand()
      .domain(d3.range(1, 3 + 1)) // Max Season + 1
      .range([0, vis.height])
      .padding(0.05);
  }

  updateVis() {
    let vis = this;
    let episodeNames = Object.keys(vis.data[0]).filter(d => d !== "name" && !d.startsWith("s") && 
    !d.startsWith("all") && !d.endsWith("words"));
    episodeNames = episodeNames.map(x => x.slice(0, -6));
    vis.newData = episodeNames.map(episode => {
      const obj = { season: episode[0], episode: episode.slice(2) };
      vis.data.forEach(character => {
        obj[character.name + "_lines"] = +character[episode + "_lines"] || 0;  // or 0 if missing
        //obj[character.name + "_words"] = +character[episode + "_words"] || 0;  // or 0 if missing
      });
      return obj;
    });
    console.log(vis.newData);
    vis.xScale.domain(vis.newData.map(x => x.episode));
    // console.log(vis.selectedCharacter);
    let maxLineCount = d3.max(vis.newData.map(x => x[vis.selectedCharacter + "_lines"]));
    //console.log(maxLineCount);
    vis.groupedBySeason = d3.groups(vis.newData, d => d.season);
    console.log(vis.groupedBySeason);
    vis.colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, maxLineCount]);
    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Assume maximum number of episodes in any season:
    const maxEpisodes = d3.max(vis.groupedBySeason, ([season, episodes]) => episodes.length);

    // Create an array [0, 1, 2, ..., maxEpisodes-1]
    const episodeIndices = d3.range(maxEpisodes);

    vis.svg.append('g')
      .attr('class', 'episode-labels')
      .selectAll('text')
      .data(episodeIndices)
      .join('text')
      .attr('x', d => d * (vis.episodeWidth + 2) + vis.episodeWidth / 2)
      .attr('y', -10) // above the first row
      .attr('text-anchor', 'middle')
      .text(d => `E${d + 1}`); // +1 because arrays are 0-indexed

    vis.svg.selectAll('g.season')
    .data(vis.groupedBySeason)
    .join('g')
    .attr('class', 'season')
    .each(function([seasonNumber, episodes], seasonIndex) {
      const g = d3.select(this);

      g.append('text')
        .attr('x', -10)  // Shift left of squares
        .attr('y', seasonIndex * (vis.episodeHeight + vis.seasonSpacing) + vis.episodeHeight / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .text(`S${seasonNumber}`)
        .style('font-size', '16px')
        .style('font-weight', '500');

      let boxes = g.selectAll('rect')
        .data(episodes)
        .join('rect')
        .attr('x', (d, i) => i * (vis.episodeWidth + 2))
        .attr('y', seasonIndex * (vis.episodeHeight + vis.seasonSpacing))
        .attr('width', vis.episodeWidth)
        .attr('height', vis.episodeHeight)
        .attr('style', 'stroke-width: 1; stroke: black')
        .attr('fill', d => vis.colorScale(d[vis.selectedCharacter + "_lines"]));

      // Tooltip event listeners
      boxes
        .on('mouseover', (event,d) => {
          console.log(d);
          d3.select('#tooltip')
            .style('opacity', 1)
            // Format number with million and thousand separator
            .html(`<div class="tooltip-label">Season: </div>${d.season}
            <div class="tooltip-label">Episode: </div>${d.episode}
            <div class="tooltip-label">Number of Lines: </div>${(d[vis.selectedCharacter + "_lines"])}
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
    });
  }
}