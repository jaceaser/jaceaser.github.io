var margin;
var width;
var height;
var x;
var y;
var z;
var keys;
var _csv;
var tooltip;
var selectedYear = 1960;
var _mapData;

async function init() {
  margin = {
    top: 50,
    right: 100,
    bottom: 80,
    left: 50
  };
  width = 960 - margin.left - margin.right;
  height = 650 - margin.top - margin.bottom;

  tooltip = d3.select("body")
    .append("div")
    .style("opacity", 0)
    .style("font-size", "16px")
    .attr("class", "tooltip");

  const data = await d3.csv("https://jaceaser.github.io/data.csv").then(d => chart(d, selectedYear));

  d3.selectAll("img").on("click", handleYearChange);
  d3.select("#back").on("click", handleBack);
  d3.select("#next").on("click", handleNext);

  updateElectoralMap();
}

function chart(csv, filterYear) {

  keys = csv.columns.slice(2);
  _csv = csv;

  var year = [...new Set(csv.map(d => d.year))]
  var lexemes = [...new Set(csv.map(d => d.lexeme))]

  var svg = d3.select("#treemap"),
    margin = {
      top: 35,
      left: 90,
      bottom: 0,
      right: 15
    },
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

  data.sort((a, b) => b.total - a.total);

  y.domain(data.map(d => d.lexeme));

  svg.selectAll(".y-axis").transition().duration(speed)
    .call(d3.axisLeft(y).tickSizeOuter(0))

  var group = svg.selectAll("g.layer")
    .data(d3.stack().keys(keys)(data), d => d.key)

  group.exit().remove()

  group.enter().insert("g", ".y-axis").append("g")
    .classed("layer", true)
    .attr("fill", function(d) {
      return z(d.key)
    });

  var bars = svg.selectAll("g.layer").selectAll("rect")
    .data(d => d, function(e) {
      return e.data.lexeme;
    })

  bars.exit().remove();


  bars.enter().append("rect")
    .attr("height", y.bandwidth())
    .merge(bars)
    .on("mousemove", tooltiphover)
    .on("mouseout", tooltipleave)
    .transition().duration(speed)
    .attr("y", d => y(d.data.lexeme))
    .attr("x", function(d) {
      return x(d[0]);
    })
    .attr("width", d => x(d[1]) - x(d[0]));
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
  selectedYear = id;
  updateMap();

  if (selectedYear == 2016) {
    d3.select('#next').style("display", "none");
  } else {
    d3.select('#next').style("display", "inline");
  }

  if (selectedYear == 1960) {
    d3.select('#back').style("display", "none");
  } else {
    d3.select('#back').style("display", "inline");
  }
}

function handleNext() {
  selectedYear = parseInt(selectedYear);

  if (selectedYear != 2016) {
    //show disabled
    selectedYear += 4;
    d3.selectAll("img").each(function() {
      if (this.id != selectedYear) {
        d3.select(this).style("opacity", ".1");
      }
    });

    //highlight selected image
    d3.selectAll("img").each(function() {
      if (this.id == selectedYear) {
        d3.select(this).style("opacity", "1");
      }
    });

    update(selectedYear, 750);
    updateMap();
    d3.select('#back').style("display", "inline");
  }

  if (selectedYear == 2016) {
    d3.select('#next').style("display", "none");
  }
}

function handleBack() {
  selectedYear = parseInt(selectedYear);

  if (selectedYear != 1960) {
    //show disabled
    selectedYear -= 4;
    d3.selectAll("img").each(function() {
      if (this.id != selectedYear) {
        d3.select(this).style("opacity", ".1");
      }
    });

    //highlight selected image
    d3.selectAll("img").each(function() {
      if (this.id == selectedYear) {
        d3.select(this).style("opacity", "1");
      }
    });

    update(selectedYear, 750);
    updateMap();
    d3.select('#next').style("display", "inline");
  }

  if (selectedYear == 1960) {
    d3.select('#back').style("display", "none");
  }
}

function tooltipleave() {
  tooltip
    .transition()
    .duration(200)
    .style("opacity", 0);

}

function tooltiphover(d) {
  var frequency;
  if (d[0] == 0 && d[1] == d.data.Republican) {
    frequency = d.data.Republican;

    tooltip
      .style("opacity", 1)
      .style("left", (d3.event.pageX + 30) + "px")
      .style("top", (d3.event.pageY + 30) + "px").html("<strong>Frequency: </strong> <span style='color:red'>" + frequency);
  } else if (d[0] != 0) {
    frequency = d.data.Democrat;

    tooltip
      .style("opacity", 1)
      .style("left", (d3.event.pageX + 30) + "px")
      .style("top", (d3.event.pageY + 30) + "px").html("<strong>Frequency: </strong> <span style='color:steelblue'>" + frequency);
  } else if (d[0] == 0 && d[1] == d.data.Democrat) {
    frequency = d.data.Democrat;

    tooltip
      .style("opacity", 1)
      .style("left", (d3.event.pageX + 30) + "px")
      .style("top", (d3.event.pageY + 30) + "px").html("<strong>Frequency: </strong> <span style='color:steelblue'>" + frequency);
  }
}

async function updateElectoralMap() {
  _mapData = await d3.json("https://jaceaser.github.io/election_results_1960_2016.json");
  var mapWidth = 920;
  var mapHeight = 580;



  var svg = d3.select("#electoralmap");

  var g = svg.append("g");

  var albersProjection = d3.geoAlbersUsa()
    .scale(1000);

  var geoPath = d3.geoPath()
    .projection(albersProjection);

  g.selectAll("path")
    .data(_mapData.features)
    .enter()
    .append("path")
    .attr("fill", initialState)
    .attr("stroke", "#333")
    .attr("d", geoPath)
    .attr("state", function(d) {
      return d.properties.name;
    });
}

function updateMap() {
  d3.selectAll("path").each(function() {
    var stateData = findState(d3.select(this).attr('state'));

    if (stateData) {
      d3.select(this)
        .style("fill", timeMatch(stateData.properties['elect' + selectedYear]));
    }

  });
}

function timeMatch(yearData) {
  if (yearData == "D") {
    return 'steelblue'
  } else if (yearData == "R") {
    return 'red'
  } else {
    return 'yellow'
  }
}

function initialState(data) {
  if (data.properties.elect1960 == "D") {
    return 'steelblue'
  } else {
    return 'red'
  }
}

function findState(state) {
  var stateData = null;

  _mapData.features.forEach(function(_data) {
    if (_data.properties.name == state) {
      stateData = _data;
    }
  });

  return stateData;
}