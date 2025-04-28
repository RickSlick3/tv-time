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
    // Character dropdown
    vis.selectedCharacter = vis.characters[0];
    vis.container = d3.select(vis.config.parentElement);
    vis.charSelect = vis.container.select('#cloud-character-select');

    vis.charSelect.selectAll('option')
      .data(vis.characters)
      .enter().append('option')
      .text(d => d);
    vis.charSelect.property('value', vis.selectedCharacter);
    vis.charSelect.on('change', event => {
      vis.selectedCharacter = d3.select(event.target).property('value');
      vis.updateVis();
    });

    // Type dropdown: words or n-grams
    vis.typeOptions = [
      { key: 'word', label: 'Single Words', max: 10 },
      { key: '3gram', label: '3-grams', max: 10 },
      { key: '4gram', label: '4-grams', max: 10 },
      { key: '5gram', label: '5-grams', max: 10 }
    ];
    vis.selectedType = vis.typeOptions[0].key;
    vis.typeSelect = vis.container.insert('select', '.focus-content')
      .attr('id', 'cloud-type-select');

    vis.typeSelect.selectAll('option')
      .data(vis.typeOptions)
      .enter().append('option')
      .attr('value', d => d.key)
      .text(d => d.label);
    vis.typeSelect.property('value', vis.selectedType);
    vis.typeSelect.on('change', event => {
      vis.selectedType = d3.select(event.target).property('value');
      vis.updateVis();
    });

    // Initial draw
    vis.updateVis();
  }

  updateVis() {
    let vis = this;
    // Filter row
    const row = vis.data.find(d => d.name === vis.selectedCharacter);
    if (!row) return;

    // Determine selected n-gram type
    const opt = vis.typeOptions.find(o => o.key === vis.selectedType);
    const maxItems = opt.max;

    // Gather counts for scale domain
    const counts = [];
    for (let i = 1; i <= maxItems; i++) {
      const c = +row[`${opt.key}_${i}_count`];
      if (c > 0) counts.push(c);
    }
    const [minCount, maxCount] = d3.extent(counts);

    // Scales
    const fontScale = d3.scaleLinear()
      .domain([1, maxCount])
      .range([15, 50]);
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Build words/phrases
    const words = [];
    for (let i = 1; i <= maxItems; i++) {
      const text = row[`${opt.key}_${i}_text`];
      const count = +row[`${opt.key}_${i}_count`];
      if (text && count > 0) {
        words.push({ text: text, value: count, size: fontScale(count) });
      }
    }

		console.log("words: ", words);

    // Clear previous cloud
    d3.select('#cloud').select('svg').remove();

    // Dimensions
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const width = 600 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select('#cloud').append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Word cloud layout
    const layout = d3.layout.cloud()
      .size([width, height])
      .words(words.map(d => ({ text: d.text, size: d.size })))
      .padding(10)
      .spiral('rectangular')
      .rotate(() => ~~(Math.random() * 2) * 90)
      .fontSize(d => d.size)
      .on('end', draw);

    layout.start();

    // Render
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
