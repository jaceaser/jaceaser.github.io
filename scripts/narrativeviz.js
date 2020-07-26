var margin;
var width;
var height;
var x;
var y;
var z;
var keys;
var _csv;

async function init() {
  margin = { top: 50, right: 100, bottom: 80, left: 50 };
  width = 960 - margin.left - margin.right;
  height = 650 - margin.top - margin.bottom;

  const data = await d3.csv("https://jaceaser.github.io/data.csv").then(d => chart(d))

  d3.selectAll("img").on("click", handleYearChange);
}

function chart(csv, filterYear) {

  keys = csv.columns.slice(2);
  _csv = csv;

  var year   = [...new Set(csv.map(d => d.year))]
  var lexemes = [...new Set(csv.map(d => d.lexeme))]

  var svg = d3.select("#treemap"),
  margin = {top: 35, left: 90, bottom: 0, right: 15},
  width = +svg.attr("width"),
  height = +svg.attr("height");

  y = d3.scaleBand()
  .range([margin.top, height - margin.bottom])
  .padding(0.1)
  .paddingOuter(0.2)
  .paddingInner(0.2)

  x = d3.scaleLinear()
  .range([margin.left, width - margin.right])

  var yAxis = svg.append("g")
  .attr("transform", `translate(${margin.left},0)`)
  .attr("class", "y-axis")

  var xAxis = svg.append("g")
  .attr("transform", `translate(0,${margin.top})`)
  .attr("class", "x-axis")

  z = d3.scaleOrdinal()
  .range(["red", "steelblue"])
  .domain(keys);

  update(filterYear, 0)
}

function update(input, speed) {
  var svg = d3.select("#treemap");
  var data = input != null ? _csv.filter(f => f.year == input) : _csv;

  data.forEach(function(d) {
    d.total = d3.sum(keys, k => +d[k])
    return d
  })

  x.domain([0, d3.max(data, d => d.total)]).nice();

  svg.selectAll(".x-axis").transition().duration(speed)
  .call(d3.axisTop(x).ticks(null, "s"))

  y.domain(data.map(d => d.lexeme));

  svg.selectAll(".y-axis").transition().duration(speed)
  .call(d3.axisLeft(y).tickSizeOuter(0))

  var group = svg.selectAll("g.layer")
  .data(d3.stack().keys(keys)(data), d => d.key)

  group.exit().remove()

  group.enter().insert("g", ".y-axis").append("g")
  .classed("layer", true)
  .attr("fill", function (d) {return z(d.key)});

  var bars = svg.selectAll("g.layer").selectAll("rect")
  .data(d => d, function (e) {return e.data.lexeme;});

  bars.exit().remove()


  bars.enter().append("rect")
  .attr("height", y.bandwidth())
  .merge(bars)
  .transition().duration(speed)
  .attr("y", d => y(d.data.lexeme))
  .attr("x", function (d) { console.log(d);  console.log(d[0]);return x(d[0]);})
  .attr("width", d => x(d[1]) - x(d[0]))

  // var text = svg.selectAll(".text")
  // .data(data, d => d.lexeme);

  // text.exit().remove()

  // text.enter().append("text")
  // .attr("class", "text")
  // .attr("text-anchor", "start")
  // .merge(text)
  // .transition().duration(speed)
  // .attr("y", d => y(d.lexeme) + y.bandwidth() / 2)
  // .attr("x", d => x(d.total) + 5)
  // .text(d => d.total)
}

function handleYearChange() {
  var id = this.id

  //show disabled
  d3.selectAll("img").each(function() {
    if (this.id != id) {
      d3.select(this).style("opacity", ".1");
    }
  });

  //highlight selected image
  d3.selectAll("img").each(function() {
    if (this.id == id) {
      d3.select(this).style("opacity", "1");
    }
  });

  update(id, 750);
}
