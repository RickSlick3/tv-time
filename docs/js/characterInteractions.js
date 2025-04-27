class CharacterInteractions {
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      margin: { top: 20, right: 40, bottom: 150, left: 0 },
      //containerWidth: 700,
      //containerHeight: 300,
      // contextHeight: 30,
      // margin: {top: 25, right: 20, bottom: 50, left: 50},
      // contextMargin: {top: 300, right: 20, bottom: 20, left: 50},
      // tooltipPadding: 15
    }
    this.data = _data;
    this.initVis();
  }

  initVis() {
    let vis = this;

    // Select container & SVG
    vis.container = d3.select(vis.config.parentElement);
    vis.svg = vis.container.select("svg")
    vis.svg
      .attr("width",  vis.container.node().clientWidth)
      .attr("height", vis.config.chartHeight || 600);

    // Compute inner width & height
    vis.width  = +vis.svg.attr("width")  - vis.config.margin.left - vis.config.margin.right;
    vis.height = +vis.svg.attr("height") - vis.config.margin.top  - vis.config.margin.bottom;
    vis.baseY  = vis.height;  // y-coordinate for all nodes/arcs

    // Append a group for drawing
    vis.g = vis.svg.append("g")
      .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Set up selection dropdown
    vis.seasons  = Array.from(new Set(vis.data.map(d => d.episode.split("_")[0])))
      .sort((a,b) => +a - +b);
    vis.episodes = Array.from(new Set(vis.data.map(d => d.episode)))
      .sort();

    // 2) build dropdown options: All, Seasons…, then Episodes…
    const opts = [
      "All",
      ...vis.seasons.map(s => `Season ${s}`),
      ...vis.episodes
    ];

    vis.dropdown = vis.container.select("#arc-episode-select");
    vis.dropdown
      .selectAll("option")
      .data(opts)
      .join("option")
      .attr("value", d => d)
      .text(d => d);
    vis.dropdown.on("change", () => vis.updateVis());

    // Values for color scale
    const counts = vis.data.map(d => d.count);
    vis.minCount = d3.min(counts);
    vis.maxCount = d3.max(counts);

    // Color Scales
    // vis.colorScale = d3.scaleSequential(d3.interpolateBlues)
    //                   .domain([0, vis.maxCount]);
    vis.colorScale = d3.scaleSequential(d3.interpolateRainbow)
                    .domain([0, vis.maxCount]);
  }

  updateVis() {
    let vis = this;

    const sel = vis.dropdown.property("value");

    // Decide filter mode
    if (sel === "All") {
      // all seasons & episodes, but still only strong links
      vis.filteredData = vis.data.filter(d => d.count >= 5);
    }
    else if (sel.startsWith("Season ")) {
      // strip off the “Season ” prefix
      const season = sel.split(" ")[1];
      vis.filteredData = vis.data.filter(d =>
        d.episode.startsWith(season + "_") && d.count >= 5
      );
    }
    else {
      // a single episode
      vis.filteredData = vis.data.filter(d =>
        d.episode === sel
      );
    }

    // Determine unique character nodes
    vis.nodes = Array.from(new Set(
      vis.filteredData.flatMap(d => [d.char1, d.char2])
    )).sort();
  
    vis.xScale = d3.scalePoint()
      .domain(vis.nodes)
      .range([0, vis.width])
      .padding(0.5);

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // --- ARCS ---
    const arcs = vis.g.selectAll(".arc")
      .data(vis.filteredData, d => d.char1 + "-" + d.char2);

    // exit
    arcs.exit().remove();

    // enter + update
    arcs.enter().append("path")
        .attr("class", "arc")
      .merge(arcs)
        .attr("d", d => {
          const x1 = vis.xScale(d.char1),
                x2 = vis.xScale(d.char2),
                dx = x2 - x1,
                rx = dx / 2,
                ry = Math.min(400, Math.abs(dx) / 2);
          return `M${x1},${vis.baseY} A${rx},${ry} 0 0,1 ${x2},${vis.baseY}`;
        })
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", d => Math.sqrt(d.count) * 1.2)
        .attr("stroke", d => vis.colorScale(d.count));

    // --- NODES ---
    const nodes = vis.g.selectAll(".node")
      .data(vis.nodes, d => d);

    const nodesEnter = nodes.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${vis.xScale(d)},${vis.baseY})`);

    nodesEnter.append("circle")
      .attr("r", 5)
      .attr("fill", "#333");

    nodesEnter.append("text")
      .attr("transform", "rotate(90)")
      .attr("dy", 5)
      .attr("dx", 10)
      .text(d => d)
      .style("pointer-events", "none");

    nodes
      .merge(nodesEnter)
      .attr("transform", d => `translate(${vis.xScale(d)},${vis.baseY})`)
      .raise();

    nodes.exit().remove();
  }
}