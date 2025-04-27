class CharacterWordCloud {
  constructor(_config, _data, _characters) {
    this.config = {
      parentElement: _config.parentElement
    };
    this.data = _data;
    this.characters = _characters;
    this.initVis();
  }

  initVis() {
    let vis = this;
    vis.selectedCharacter = vis.characters[0];
    vis.container = d3.select(vis.config.parentElement);
    vis.select = d3.select('#cloud-character-select');

    vis.select.selectAll('option')
      .data(vis.characters)
      .enter().append('option')
      .text(d => d);
    vis.select.property('value', vis.selectedCharacter);

    vis.select.on('change', event => {
      vis.selectedCharacter = d3.select(event.target).property('value');
      vis.updateVis();
    });

    // Initial draw
    vis.updateVis();
  }

  updateVis() {
    let vis = this;
    // Filter data for selected character
    const row = vis.data.find(d => d.name === vis.selectedCharacter);
    if (!row) return;

    // Gather counts for scale domain
    const counts = [];
    for (let i = 1; i <= 10; i++) {
      const count = +row[`word_${i}_count`];
      if (count > 0) counts.push(count);
    }
    const [minCount, maxCount] = d3.extent(counts);

    // Define font size scale
    const fontScale = d3.scaleLinear()
      .domain([minCount, maxCount])
      .range([25, 100]);  // adjust min/max font size as needed

		const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Construct word list from CSV columns
    const words = [];
    for (let i = 1; i <= 10; i++) {
      const text = row[`word_${i}_text`];
      const count = +row[`word_${i}_count`];
      if (text && count > 0) {
        words.push({ text: text, value: count, size: fontScale(count) });
      }
    }

    // Clear previous visualization
    d3.select('#my_dataviz').select('svg').remove();

    // Set dimensions and margins
    const margin = { top: 10, right: 20, bottom: 10, left: 20 };
    const width = 700 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    // Append SVG
    const svg = d3.select('#my_dataviz').append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create the word cloud layout
    const layout = d3.layout.cloud()
      .size([width, height])
      .words(words.map(d => ({ text: d.text, size: d.size })))
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
      .fontSize(d => d.size)
      .on('end', draw);

    layout.start();

    // Draw function
    function draw(wordsData) {
      svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`)
        .selectAll('text')
        .data(wordsData)
        .enter().append('text')
        .style('font-size', d => d.size + 'px')
        .style('fill', (d, i) => colorScale(i))
        .attr('text-anchor', 'middle')
        .style('font-family', 'Impact')
        .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text(d => d.text);
    }
  }
}
