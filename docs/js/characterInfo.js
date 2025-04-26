class CharacterInfo {
  constructor(_config, _data, _characters) {
    this.config = {
      parentElement: _config.parentElement,
      //containerWidth: 700,
      //containerHeight: 300,
      // contextHeight: 30,
      // margin: {top: 25, right: 20, bottom: 50, left: 50},
      // contextMargin: {top: 300, right: 20, bottom: 20, left: 50},
      // tooltipPadding: 15
    }
    this.data = _data;
    this.characters = _characters;
    this.initVis();
  }

  initVis() {
    let vis = this;

    vis.container = d3.select("#character-focus");

    vis.select = d3.select("#character-select");

    vis.select.selectAll("option")
      .data(vis.characters)
      .enter()
      .append("option")
      .text(d => d);
  }

  updateVis() {
    let vis = this;
    vis.renderVis();
  }

  renderVis() {
    let vis = this;
  }
}