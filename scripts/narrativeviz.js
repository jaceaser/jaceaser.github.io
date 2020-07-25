async function init() {
  var margin = { top: 50, right: 100, bottom: 80, left: 50 };
  var width = 960 - margin.left - margin.right;
  var height = 650 - margin.top - margin.bottom;

  var svg = d3.select("#treemap")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");



  const data = await d3.csv("https://github.com/jaceaser/jaceaser.github.io/data.csv");
}
