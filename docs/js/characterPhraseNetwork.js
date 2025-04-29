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

    // Build phraseMap for each speaker → listener → [phrases]
		const phraseMap = {};
    vis.data
      .filter(d => vis.characters.includes(d.speaker) && vis.characters.includes(d.listener))
      .forEach(d => {
        if (!phraseMap[d.speaker]) phraseMap[d.speaker] = {};
        if (!phraseMap[d.speaker][d.listener]) phraseMap[d.speaker][d.listener] = [];
        // previously: phraseMap[d.speaker][d.listener].push(d.phrase);
        phraseMap[d.speaker][d.listener].push({
          gram3:         d['3gram_phrase'],
          gram3_count:   +d['3gram_count'],
          gram4:         d['4gram_phrase'],
          gram4_count:   +d['4gram_count'],
          gram5:         d['5gram_phrase'],
          gram5_count:   +d['5gram_count']
        });
      });

    const enrichedNodes = nodes.map(node => {
      const outgoing = phraseMap[node.name] || {};
      const connections = Object.entries(outgoing).map(([listener, phrases]) => ({
        listener,
        phrases
      }));
      return { ...node, connections };
    });

    // vis.graph = { nodes, links };
    vis.graph = { nodes: enrichedNodes, links };
    console.log("Graph:", vis.graph);

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
        const fromHtml = `<div class="tooltip-from">From ${d.name}:</div>`;
        let connectionsHtml = ``;
        if (d.connections.length == 0) {
          connectionsHtml = `<div class="tooltip-group"><div class="tooltip-label">No connections</div></div>`;
        }
        else {
          connectionsHtml = d.connections.map(c => `
            <div class="network-tooltip-group">
              <div class="tooltip-label">To ${c.listener}:</div>
              ${c.phrases.map(p => `
                <div class="tooltip-phrase">
                  <div class="tooltip-label">3-gram (${p.gram3_count}): ${p.gram3}</div>
                  <div class="tooltip-label">4-gram (${p.gram4_count}): ${p.gram4}</div>
                  <div class="tooltip-label">5-gram (${p.gram5_count}): ${p.gram5}</div>
                </div>
              `).join('')}
            </div>
          `).join('');
        }

        d3.select('#network-tooltip')
          .html(fromHtml + connectionsHtml)
          .style('left',  (event.pageX + 10) + 'px')
          .style('top',   (event.pageY - 10) + 'px')
          .style('opacity', 1)
          .style('font-size', '14px');
      })
      .on('mousemove', (event) => {
				d3.select('#network-tooltip')
					.style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
					.style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
			})
			.on('mouseleave', () => {
				d3.select('#network-tooltip').style('opacity', 0);
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
