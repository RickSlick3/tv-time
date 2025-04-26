class CharacterInteractions {
  constructor(_config, _data) {
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
    this.initVis();
  }

  initVis() {
    let vis = this;
  }

  updateVis() {
    let vis = this;
    vis.renderVis();
  }

  renderVis() {
    let vis = this;
  }
}