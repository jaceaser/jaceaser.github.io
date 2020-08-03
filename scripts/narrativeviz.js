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
  width = 768 - margin.left - margin.right;
  height = 520 - margin.top - margin.bottom;

  tooltip = d3.select("body")
    .append("div")
    .style("opacity", 0)
    .style("font-size", "16px")
    .attr("class", "tooltip");
    handleAnnotations();

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

  var svg = d3.select("#barchart"),
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

  update(filterYear, 0);
}

function update(input, speed) {
  var svg = d3.select("#barchart");
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

  if (this.id != "image") {
      //show disabled
    d3.selectAll("img").each(function() {
      if (this.id != id && this.id != "image") {
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

  handleAnnotations();
  }
}

function handleNext() {
  selectedYear = parseInt(selectedYear);

  if (selectedYear != 2016) {
    //show disabled
    selectedYear += 4;
    d3.selectAll("img").each(function() {
      if (this.id != selectedYear && this.id != "image") {
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
  }

  handleAnnotations();
}

function handleBack() {
  selectedYear = parseInt(selectedYear);

  if (selectedYear != 1960) {
    //show disabled
    selectedYear -= 4;
    d3.selectAll("img").each(function() {
      if (this.id != selectedYear &&  this.id != "image") {
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

  handleAnnotations();
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

function handleAnnotations() {
  d3.selectAll(".annotation").remove();

  var year = parseInt(selectedYear);

  switch (year) {
    case 1960:
      handle1960Annotations();
      break;
    case 1964:
      handle1964Annotations();
      break;
    case 1968:
      handle1968Annotations();
      break;
    case 1972:
      handle1972Annotations();
      break;
    case 1976:
      handle1976Annotations();
      break;
    case 1980:
      handle1980Annotations();
      break;
    case 1984:
      handle1984Annotations();
      break;
    case 1988:
      handle1988Annotations();
      break;
    case 1992:
      handle1992Annotations();
      break;
    case 1996:
      handle1996Annotations();
      break;
    case 2000:
      handle2000Annotations();
      break;
    case 2004:
      handle2004Annotations();
      break;
    case 2008:
      handle2008Annotations();
      break;
    case 2012:
      handle2012Annotations();
      break;
    case 2016:
      handle2016Annotations();
      break;
  }
}

function handle1960Annotations() {
  var svg = d3.select("#electoralmap");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "black")
    .style("stroke-width", .3)
    .attr("x1", 705)
    .attr("y1", 400)
    .attr("x2", 600)
    .attr("y2", 555);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 560)
    .attr("dy", "1em").attr("font-size", "15")
    .text("In 1960 Florida was the only Southern state to vote Republican");


  svg = d3.select("#barchart");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 705)
    .attr("y1", 360)
    .attr("x2", 565)
    .attr("y2", 245);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 705)
    .attr("y1", 360)
    .attr("x2", 870)
    .attr("y2", 95);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 600)
    .attr("y", 365)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("The 1960 Democratic platform was based on change");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 600)
    .attr("y", 365)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("using words like shall, new.");


  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "red")
    .style("stroke-width", .3)
    .attr("x1", 600)
    .attr("y1", 460)
    .attr("x2", 285)
    .attr("y2", 420);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "red")
    .style("stroke-width", .3)
    .attr("x1", 600)
    .attr("y1", 460)
    .attr("x2", 370)
    .attr("y2", 335);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 500)
    .attr("y", 465)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "red")
    .text("The 1960 Repulican Platform used words like support &");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 500)
    .attr("y", 465)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "red")
    .text("pledge when referring to Civil Rights");

}

function handle1964Annotations() {
  var svg = d3.select("#electoralmap");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "black")
    .style("stroke-width", .3)
    .attr("x1", 600)
    .attr("y1", 375)
    .attr("x2", 600)
    .attr("y2", 555);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 560)
    .attr("dy", "1em").attr("font-size", "15")
    .text("In 1964 many Southern States voted Republican");


  svg = d3.select("#barchart");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 705)
    .attr("y1", 260)
    .attr("x2", 655)
    .attr("y2", 155);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 705)
    .attr("y1", 260)
    .attr("x2", 685)
    .attr("y2", 85);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 705)
    .attr("y1", 260)
    .attr("x2", 490)
    .attr("y2", 250);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 705)
    .attr("y1", 260)
    .attr("x2", 675)
    .attr("y2", 100);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 650)
    .attr("y", 265)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("The 1964 Democratic Platform touted the passage of the ");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 650)
    .attr("y", 265)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("1960, 1961, & 1964 Civil Rights Act. ");


  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "red")
    .style("stroke-width", .3)
    .attr("x1", 600)
    .attr("y1", 460)
    .attr("x2", 245)
    .attr("y2", 452);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "red")
    .style("stroke-width", .3)
    .attr("x1", 600)
    .attr("y1", 460)
    .attr("x2", 325)
    .attr("y2", 337);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 500)
    .attr("y", 465)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "red")
    .text("The 1964 Republican Platform made very few references to");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 500)
    .attr("y", 465)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "red")
    .text("the Civil Rights Acts. Instead they mentioned freedom(and being free)");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 500)
    .attr("y", 465)
    .attr("dy", "3em").attr("font-size", "15")
    .style("fill", "red")
    .text("and governments role in fostering and maintaining freedom.");
}

function handle1968Annotations() {
  var svg = d3.select("#electoralmap");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "black")
    .style("stroke-width", .3)
    .attr("x1", 600)
    .attr("y1", 375)
    .attr("x2", 600)
    .attr("y2", 545);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 545)
    .attr("dy", "1em").attr("font-size", "15")
    .text("In 1968 George Wallace, a former Governer of Alabama,");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 545)
    .attr("dy", "2em").attr("font-size", "15")
    .text("won many southern states as an Independent. He was pro Segregation.");


  svg = d3.select("#barchart");


  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 565)
    .attr("y1", 380)
    .attr("x2", 420)
    .attr("y2", 365);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 565)
    .attr("y1", 380)
    .attr("x2", 510)
    .attr("y2", 310);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 570)
    .attr("y", 365)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("The 1968 Democratic platform focused on People");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 570)
    .attr("y", 365)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("and Education. There were very few references to Civil Rights.");


  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "red")
    .style("stroke-width", .3)
    .attr("x1", 495)
    .attr("y1", 475)
    .attr("x2", 310)
    .attr("y2", 430);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 500)
    .attr("y", 445)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "red")
    .text("The 1968 Republican Platform used the word \"encourage\" frequently.");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 500)
    .attr("y", 445)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "red")
    .text("In context, the GOP was encouraging state and local governments");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 500)
    .attr("y", 445)
    .attr("dy", "3em").attr("font-size", "15")
    .style("fill", "red")
    .text("to enact programs and change with the support of the federal gov.");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 500)
    .attr("y", 445)
    .attr("dy", "4em").attr("font-size", "15")
    .style("fill", "red")
    .text("The overall use of this word is very positive.");
}

function handle1972Annotations() {
  var svg = d3.select("#electoralmap");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "black")
    .style("stroke-width", .3)
    .attr("x1", 600)
    .attr("y1", 275)
    .attr("x2", 600)
    .attr("y2", 530);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 530)
    .attr("dy", "1em").attr("font-size", "15")
    .text("In 1972 Richard Nixon completely swept the U.S.");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 530)
    .attr("dy", "2em").attr("font-size", "15")
    .text("only losing Massachusetts and D.C. ");


  svg = d3.select("#barchart");


  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 375)
    .attr("y1", 350)
    .attr("x2", 320)
    .attr("y2", 355);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 375)
    .attr("y1", 350)
    .attr("x2", 325)
    .attr("y2", 335);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 380)
    .attr("y", 330)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("The 1972 Democratic focused on Tax Reform(Distribution), the Party");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 380)
    .attr("y", 330)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("and Education. The references to Civil Rights began to expand outside of race.");


  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "red")
    .style("stroke-width", .3)
    .attr("x1", 370)
    .attr("y1", 420)
    .attr("x2", 310)
    .attr("y2", 390);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "red")
    .style("stroke-width", .3)
    .attr("x1", 370)
    .attr("y1", 420)
    .attr("x2", 290)
    .attr("y2", 490);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 395)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "red")
    .text("The 1972 Republican Platform made only 2 mentions of Civil Rights.");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 395)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "red")
    .text("They made many reference to the last 4 \"years\" and what the accomplished.");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 395)
    .attr("dy", "3em").attr("font-size", "15")
    .style("fill", "red")
    .text("The GOP mentioned States referring to US in a very positive");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 395)
    .attr("dy", "4em").attr("font-size", "15")
    .style("fill", "red")
    .text("light, while the Democratic parties tone was much more pessimistic.");
}

function handle1976Annotations() {
  var svg = d3.select("#electoralmap");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "black")
    .style("stroke-width", .3)
    .attr("x1", 675)
    .attr("y1", 350)
    .attr("x2", 600)
    .attr("y2", 530);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 530)
    .attr("dy", "1em").attr("font-size", "15")
    .text("In 1976 Jimmy Carter seemed to swing the South back, but");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 530)
    .attr("dy", "2em").attr("font-size", "15")
    .text("he was from Georgia and Richard Nixon had resigned.");


  svg = d3.select("#barchart");


  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 395)
    .attr("y1", 365)
    .attr("x2", 340)
    .attr("y2", 345);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 395)
    .attr("y1", 365)
    .attr("x2", 280)
    .attr("y2", 395);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 400)
    .attr("y", 330)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("The 1976 Democratic highlights the Oil Embargo and the need for alternative energy");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 400)
    .attr("y", 330)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("sources. Additionally, they also proposed the Equal Rights Amendment which");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 400)
    .attr("y", 330)
    .attr("dy", "3em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("sought to eliminate discrimination based on sex. Health was also mentioned,");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 400)
    .attr("y", 330)
    .attr("dy", "4em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("referring to healthcare and clean air.");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "red")
    .style("stroke-width", .3)
    .attr("x1", 370)
    .attr("y1", 460)
    .attr("x2", 280)
    .attr("y2", 415);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 425)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "red")
    .text("The 1976 Republican Platform made no mention of Civil Rights, however");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 425)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "red")
    .text("they made references to the Equal Rights Amendment and criticized the Democratic");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 425)
    .attr("dy", "3em").attr("font-size", "15")
    .style("fill", "red")
    .text("controlled congress. While not one of the top 15, the GOP mentioned abortion and");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 425)
    .attr("dy", "4em").attr("font-size", "15")
    .style("fill", "red")
    .text("passing an amendment to protect unborn children. The Democratic platform mentioned abortion");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 425)
    .attr("dy", "5em").attr("font-size", "15")
    .style("fill", "red")
    .text("but, said they did not want to overturn a SCOTUS ruling.");
}

function handle1980Annotations() {
  var svg = d3.select("#electoralmap");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "black")
    .style("stroke-width", .3)
    .attr("x1", 675)
    .attr("y1", 350)
    .attr("x2", 600)
    .attr("y2", 530);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 530)
    .attr("dy", "1em").attr("font-size", "15")
    .text("In 1980 Jimmy Carter was only able to win his home");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 530)
    .attr("dy", "2em").attr("font-size", "15")
    .text("state in the south.");


  svg = d3.select("#barchart");

   svg.append("rect")
    .attr("class", "annotation")
    .attr("height", 75)
    .attr("y", 245)
    .attr("x", 470)
    .attr("width", 450)
    .attr("fill", "lightgray");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 475)
    .attr("y", 250)
    .attr("dy", "1em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("While not reflected in the top-15 term frequency for any party in 1980, there are a");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 475)
    .attr("y", 250)
    .attr("dy", "2em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("few interesting insights. In 1980 there became a clearer line between conservative");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 475)
    .attr("y", 250)
    .attr("dy", "3em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("and liberal stances between the party. The GOP intended to recognize the importance");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 475)
    .attr("y", 250)
    .attr("dy", "4em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("of strong families and abolition of abortion, while the Democrats took a stand and");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 475)
    .attr("y", 250)
    .attr("dy", "5em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("declared they stood by a women's right to choose.");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "red")
    .style("stroke-width", .3)
    .attr("x1", 395)
    .attr("y1", 345)
    .attr("x2", 360)
    .attr("y2", 330);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 400)
    .attr("y", 325)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "red")
    .text("The 1980 Republican Platform capitalized on the Carter Administration's failures.");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 400)
    .attr("y", 325)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "red")
    .text("While not focused, they made broad statements regarding discrimination and equal rights.");
}

function handle1984Annotations() {
  var svg = d3.select("#electoralmap");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "black")
    .style("stroke-width", .3)
    .attr("x1", 510)
    .attr("y1", 125)
    .attr("x2", 600)
    .attr("y2", 530);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 350)
    .attr("y", 530)
    .attr("dy", "1em").attr("font-size", "15")
    .text("In 1984 Ronald Reagan dominated and only conceded Minnesota and D.C.");


  svg = d3.select("#barchart");

  
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 825)
    .attr("y1", 150)
    .attr("x2", 925)
    .attr("y2", 50);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 750)
    .attr("y", 150)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("Democratic has not been the");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 750)
    .attr("y", 150)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("most frequent term since 1960.");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 600)
    .attr("y1", 330)
    .attr("x2", 555)
    .attr("y2", 265);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 600)
    .attr("y1", 330)
    .attr("x2", 520)
    .attr("y2", 290);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 425)
    .attr("y", 330)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("The 1984 Democratic platform did not offer any concrete solutions.");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 425)
    .attr("y", 330)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("We can see party continues to be a strong term used within the platform");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 425)
    .attr("y", 330)
    .attr("dy", "3em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("since 1972. They also used the term \"new\" in a reference to change.");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "red")
    .style("stroke-width", .3)
    .attr("x1", 370)
    .attr("y1", 490)
    .attr("x2", 325)
    .attr("y2", 485);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "red")
    .style("stroke-width", .3)
    .attr("x1", 370)
    .attr("y1", 490)
    .attr("x2", 315)
    .attr("y2", 515);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 455)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "red")
    .text("The 1984 Republican Platform began to incorporate Reaganomics and discuss free enterprise.");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 455)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "red")
    .text("The message included facts and percentages highlighting the successes of his");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 455)
    .attr("dy", "3em").attr("font-size", "15")
    .style("fill", "red")
    .text("administration. Additionally, the GOP platform also renewed references to the 1964 Civil Rights");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 375)
    .attr("y", 455)
    .attr("dy", "4em").attr("font-size", "15")
    .style("fill", "red")
    .text("Act and discussed the importance of equal opportunity.");
}

function handle1988Annotations() {
  var svg = d3.select("#electoralmap");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "black")
    .style("stroke-width", .3)
    .attr("x1", 625)
    .attr("y1", 350)
    .attr("x2", 600)
    .attr("y2", 530);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 530)
    .attr("dy", "1em").attr("font-size", "15")
    .text("George H.W. Bush continued to win the South in 1988.");


  svg = d3.select("#barchart");

   svg.append("rect")
    .attr("class", "annotation")
    .attr("height", 50)
    .attr("y", 345)
    .attr("x", 470)
    .attr("width", 380)
    .attr("fill", "lightgray");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 475)
    .attr("y", 350)
    .attr("dy", "1em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("The 1988 Republican platform mentions Family 54 times compared to");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 475)
    .attr("y", 350)
    .attr("dy", "2em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("8 times in the Democratic platform. The GOP platform mentioned");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 475)
    .attr("y", 350)
    .attr("dy", "3em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("Abortion 6 times, while the Democratic platform did not metion it at all.");


  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 295)
    .attr("y1", 465)
    .attr("x2", 180)
    .attr("y2", 430);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 295)
    .attr("y1", 465)
    .attr("x2", 180)
    .attr("y2", 410);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 295)
    .attr("y1", 465)
    .attr("x2", 360)
    .attr("y2", 345);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 295)
    .attr("y1", 465)
    .attr("x2", 170)
    .attr("y2", 450);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "steelblue")
    .style("stroke-width", .3)
    .attr("x1", 295)
    .attr("y1", 465)
    .attr("x2", 165)
    .attr("y2", 470);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 300)
    .attr("y", 450)
    .attr("dy", "1em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("The 1988 Democratic Platform had a different tone and used Believe frequently");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 300)
    .attr("y", 450)
    .attr("dy", "2em").attr("font-size", "15")
    .style("fill", "steelblue")
    .text("to highlight its stances, including health care, education, and investment in children");
}

function handle1992Annotations() {
  var svg = d3.select("#electoralmap");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "black")
    .style("stroke-width", .3)
    .attr("x1", 540)
    .attr("y1", 370)
    .attr("x2", 600)
    .attr("y2", 530);
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 530)
    .attr("dy", "1em").attr("font-size", "15")
    .text("Bill Clinton won his home state(AR) and Louisiana");


  svg = d3.select("#barchart");

   svg.append("rect")
    .attr("class", "annotation")
    .attr("height", 60)
    .attr("y", 245)
    .attr("x", 520)
    .attr("width", 360)
    .attr("fill", "lightgray");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 525)
    .attr("y", 250)
    .attr("dy", "1em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("The 1992 Republican platform increased its reference to Family(62)");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 525)
    .attr("y", 250)
    .attr("dy", "2em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("while the Democrats did as well(20). The GOP platform mentioned");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 525)
    .attr("y", 250)
    .attr("dy", "3em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("Abortion 4 times, while the Democratic platform mentioned it twice");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 525)
    .attr("y", 250)
    .attr("dy", "4em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("in conjunction with health care.");


  // svg.append('line')
  //   .attr("class", "annotation")
  //   .style("stroke", "steelblue")
  //   .style("stroke-width", .3)
  //   .attr("x1", 295)
  //   .attr("y1", 465)
  //   .attr("x2", 180)
  //   .attr("y2", 430);
  // svg.append('line')
  //   .attr("class", "annotation")
  //   .style("stroke", "steelblue")
  //   .style("stroke-width", .3)
  //   .attr("x1", 295)
  //   .attr("y1", 465)
  //   .attr("x2", 180)
  //   .attr("y2", 410);
  // svg.append('line')
  //   .attr("class", "annotation")
  //   .style("stroke", "steelblue")
  //   .style("stroke-width", .3)
  //   .attr("x1", 295)
  //   .attr("y1", 465)
  //   .attr("x2", 360)
  //   .attr("y2", 345);
  // svg.append('line')
  //   .attr("class", "annotation")
  //   .style("stroke", "steelblue")
  //   .style("stroke-width", .3)
  //   .attr("x1", 295)
  //   .attr("y1", 465)
  //   .attr("x2", 170)
  //   .attr("y2", 450);
  // svg.append('line')
  //   .attr("class", "annotation")
  //   .style("stroke", "steelblue")
  //   .style("stroke-width", .3)
  //   .attr("x1", 295)
  //   .attr("y1", 465)
  //   .attr("x2", 165)
  //   .attr("y2", 470);
  // svg.append("text")
  //   .attr("class", "annotation")
  //   .attr("x", 300)
  //   .attr("y", 450)
  //   .attr("dy", "1em").attr("font-size", "15")
  //   .style("fill", "steelblue")
  //   .text("The 1992 Democratic Platform had a different tone and used Believe frequently");
  // svg.append("text")
  //   .attr("class", "annotation")
  //   .attr("x", 300)
  //   .attr("y", 450)
  //   .attr("dy", "2em").attr("font-size", "15")
  //   .style("fill", "steelblue")
  //   .text("to highlight its stances, including health care, education, and investment in children");
}

function handle1996Annotations() {
  var svg = d3.select("#electoralmap");

  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "black")
    .style("stroke-width", .3)
    .attr("x1", 675)
    .attr("y1", 340)
    .attr("x2", 600)
    .attr("y2", 530);
  svg.append('line')
    .attr("class", "annotation")
    .style("stroke", "black")
    .style("stroke-width", .3)
    .attr("x1", 700)
    .attr("y1", 400)
    .attr("x2", 600)
    .attr("y2", 530);    
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 450)
    .attr("y", 530)
    .attr("dy", "1em").attr("font-size", "15")
    .text("Bill Clinton added Florida, but lost Georgia");


  svg = d3.select("#barchart");

   svg.append("rect")
    .attr("class", "annotation")
    .attr("height", 50)
    .attr("y", 245)
    .attr("x", 520)
    .attr("width", 395)
    .attr("fill", "lightgray");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 525)
    .attr("y", 250)
    .attr("dy", "1em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("The 1996 Republican platform increased its reference to Abortion(11) while");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 525)
    .attr("y", 250)
    .attr("dy", "2em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("the Democrats mentioned is sparingly(2). The GOP platform mentioned");
  svg.append("text")
    .attr("class", "annotation")
    .attr("x", 525)
    .attr("y", 250)
    .attr("dy", "3em").attr("font-size", "12").attr("font-weight","bold")
    .style("fill", "black")
    .text("divorce and the review of divorce laws to create family stability.");
}