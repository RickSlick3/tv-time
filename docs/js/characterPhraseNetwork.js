// https://d3-graph-gallery.com/graph/network_basic.html

class CharacterPhraseNetwork {
  constructor(_config, _data, _characters) {
    this.config = { 
			parentElement: _config.parentElement,
			tooltipPadding: 15
		};
    this.data = _data;
    this.characters = _characters;
    this.initVis();
  }

  initVis() {
    let vis = this;
    // Set up container
    vis.container = d3.select(vis.config.parentElement);
    // Initial draw
    vis.updateVis();
  }

  updateVis() {
    let vis = this;
    // 1) Build nodes map and array
    const nodeByName = {};
    const nodes = [];
    let nextId = 1;

    vis.data.forEach(d => {
      // Only include speakers/listeners in the selected character list
      if (vis.characters.includes(d.speaker) && !(d.speaker in nodeByName)) {
        nodeByName[d.speaker] = nextId++;
        nodes.push({ id: nodeByName[d.speaker], name: d.speaker });
      }
      if (vis.characters.includes(d.listener) && !(d.listener in nodeByName)) {
        nodeByName[d.listener] = nextId++;
        nodes.push({ id: nodeByName[d.listener], name: d.listener });
      }
    });

    // 2) Build links array
    const links = vis.data
      .filter(d => vis.characters.includes(d.speaker) && vis.characters.includes(d.listener))
      .map(d => ({
        source: nodeByName[d.speaker],
        target: nodeByName[d.listener],
      }));

    vis.graph = { nodes, links };

		console.log("Graph nodes:", vis.graph);

    // 3) Render with force layout
    vis.renderVis();
  }

  renderVis() {
    let vis = this;
    const margin = { top: 10, right: 30, bottom: 30, left: 40 };
    const width = 1000 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    // Clear any existing svg
    vis.container.select('svg').remove();

    // Append new svg
    const svg = vis.container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Draw links
    const link = svg.selectAll('line')
      .data(vis.graph.links)
      .enter().append('line')
      .style('stroke', '#aaa');
			// .style('stroke-width', d => Math.sqrt(d.value));

    // Draw nodes
    const node = svg.selectAll('circle')
      .data(vis.graph.nodes)
      .enter().append('circle')
      .attr('r', 5)
      .style('fill', 'black')
			// Tooltip events
      .on('mouseover', (event, d) => {
        d3.select('#tooltip')
          // .html(
          //   `<div class="tooltip-label">Source:</div>${d.source.name}` +
          //   `<div class="tooltip-label">Target:</div>${d.target.name}` +
          //   `<div class="tooltip-label">3-gram (${d.gram3_count}):</div>${d.gram3}` +
          //   `<div class="tooltip-label">4-gram (${d.gram4_count}):</div>${d.gram4}` +
          //   `<div class="tooltip-label">5-gram (${d.gram5_count}):</div>${d.gram5}`
          // )
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .style('opacity', 1);
      })
      .on('mousemove', (event) => {
				d3.select('#tooltip')
					.style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
					.style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
			})
			.on('mouseleave', () => {
				d3.select('#tooltip').style('opacity', 0);
			});

    // Force simulation
    const simulation = d3.forceSimulation(vis.graph.nodes)
      .force('link', d3.forceLink(vis.graph.links)
        .id(d => d.id)
        .distance(100)       // shorter link distance
        .strength(0.5))     // stronger link force
      .force('charge', d3.forceManyBody().strength(-500))  // weaker repulsion
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(5))       // prevent overlap
      .on('tick', ticked);

    function ticked() {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    }
  }
}
