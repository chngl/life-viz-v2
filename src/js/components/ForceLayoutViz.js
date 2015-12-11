var Actions = require('../flux/LifeVizActions');
var React = require('react');
var Store = require('../flux/LifeVizDataStore');
var VizMixin = require('./VizMixin');

var d3 = require('d3');
var friendsData = require('../friends_data');

var Viz = React.createClass({

  mixins: [VizMixin],
  _nodes: null,
  _links: null,
  _circles: null,
  _lines: null,
  _genderLabels: null,
  _yearLabels: null,
  _gCircles: null,
  _gLines: null,
  _gGenderLabels: null,
  _force: null,
  _currentStage: 0,

  _friendYearCenters: null,
  _genderCenters: null,

  _genderClusterBoxes: {
    MALE: {x1: 0, y1: 0, x2: 0, y2: 0, label: 'Male'},
    FEMALE: {x1: 0, y1: 0, x2: 0, y2: 0, label: 'Female'},
    UNKNOWN: {x1: 0, y1: 0, x2: 0, y2: 0, label: 'They didnot share'},
  },

  _yearClusterBoxes: {
    2011: {x1: 0, y1: 0, x2: 0, y2: 0, label: '2011'},
    2012: {x1: 0, y1: 0, x2: 0, y2: 0, label: '2012'},
    2013: {x1: 0, y1: 0, x2: 0, y2: 0, label: '2013'},
    2014: {x1: 0, y1: 0, x2: 0, y2: 0, label: '2014'},
    2015: {x1: 0, y1: 0, x2: 0, y2: 0, label: '2015'},
    UNKNOWN: {x1: 0, y1: 0, x2: 0, y2: 0, label: 'Unknown'},
  },

  _defaultCircleColor: '#718ABE',
  _defaultLineColor: 'lightgray',

  _genderColors: {
    MALE: 'lightblue',
    FEMALE: 'lightcoral',
    UNKNOWN: 'lightgray',
  },

  _relationshipColors: {
    DIVORCED: 'bisque',
    ENGAGED: 'khaki',
    IN_A_RELATIONSHIP: 'lightblue',
    MARRIED: 'lightcoral',
    SINGLE: '#A5E5C6',
    none: 'lightgray',
  },

  componentWillMount: function() {
    this._currentStage = this.props.currentStage;
    this._nodes = friendsData.nodes;
    this._links = friendsData.links;
    Store.addChangeListener(this._onStageChange); 
  },

  shouldComponentUpdate: function() {
    return false;
  },

  componentWillUnmount: function() {
    Store.removeChangeListener(this._onStageChange);
  },

  _onStageChange: function() {
    this._currentStage = Store.getCurrentStage();
    this._renderForceGraphByStage();
  },

  _render: function() {
    this._initCenters();
    this._force = d3.layout.force()
      .size([this._chartWidth, this._chartHeight])
      .nodes(this._nodes)
      .gravity(0.2)
      .charge(-30)
      .on('tick', this._tick);

    // zoom and drag controls
    var zoom = d3.behavior.zoom()
      .scaleExtent([1, 10])
      .on("zoom", this._onZoom);
    var drag = this._force.drag()
      .on('dragstart', this._onDragStart)
      .on('drag', this._onDrag);

    // add a background rect, so that it'll catch all the scroll event
    this._svg.append('rect')
      .attr('opacity', 0)
      .attr('width', this._width)
      .attr('height', this._height)
      .call(zoom);

    this._gLines = this._svg.append('g').call(zoom);
    this._gCircles = this._svg.append('g').call(zoom);
    this._gGenderLabels = this._svg.append('g').call(zoom);
    this._gYearLabels = this._svg.append('g').call(zoom);

    this._genderLabels = this._gGenderLabels.selectAll('text')
      .data(d3.values(this._genderClusterBoxes)).enter()
      .append('text')
      .style('font-size', 14)
      .style('font-family', "'lucida grande',tahoma,verdana,arial,sans-serif")
      .text(function(d) { return d.label; });

    this._yearLabels = this._gYearLabels.selectAll('text')
      .data(d3.values(this._yearClusterBoxes)).enter()
      .append('text')
      .style('font-size', 14)
      .style('font-family', "'lucida grande',tahoma,verdana,arial,sans-serif")
      .text(function(d) { return d.label; });

    d3.select('body').select('.tooltip').remove();
    this._tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip well');

    this._circles = this._gCircles.selectAll('circle').data(this._nodes)
      .enter().append('circle')
      .style('stroke', 'white')
      .on('mouseover', this._onMouseover)
      .on('mouseout', this._onMouseout)
      .call(drag);
    this._renderForceGraphByStage();
  },

  _initCenters: function() {
    this._friendYearCenters = {
      2011: {x: 1 / 4 * this._chartWidth, y: 1 / 3 * this._chartHeight, year: '2011'},
      2012: {x: 2 / 4 * this._chartWidth, y: 1 / 3 * this._chartHeight, year: '2012'},
      2013: {x: 3 / 4 * this._chartWidth, y: 1 / 3 * this._chartHeight, year: '2013'},
      2014: {x: 1 / 3 * this._chartWidth, y: 2 / 3 * this._chartHeight, year: '2014'},
      2015: {x: 2 / 3 * this._chartWidth, y: 2 / 3 * this._chartHeight, year: '2015'},
      UNKNOWN: {x: 5 / 6 * this._chartWidth, y: 2 / 3 * this._chartHeight, year: 'unknown'}
    };
    this._genderCenters = {
      MALE: {x: 1 / 4 * this._chartWidth, y: 1 / 2 * this._chartHeight, gender: 'Male'},
      FEMALE: {x: 2 / 4 * this._chartWidth, y: 1 / 2 * this._chartHeight, gender: 'Female'},
      UNKNOWN: {x: 3 / 4 * this._chartWidth, y: 1 / 2 * this._chartHeight, gender: 'They didnot share'}
    };
  },

  _renderForceGraphByStage: function() {
    if (this._lines) {
      this._lines.remove('*');
      this._lines = null;
    }
    
    // reset force based on stage
    if (this._currentStage === 4) {
      this._force
        .links(this._links)
        .charge(-90)
        .on('tick', this._tick)
        .start();
    } else {
      this._force.links([])
        .gravity(0.2)
        .charge(-30)
        .on('tick', this._tick)
        .start();
    }
    switch (this._currentStage) {
      case 0:
        this._svg.style('opacity', 1);
        d3.select('.viz').style('position', 'fixed');
        this._context.clearRect(0, 0, this._width, this._height);
        this._gGenderLabels.style('opacity', 0);
        this._gYearLabels.style('opacity', 0);
        this._circles
          .attr('r', 8)
          .style('fill', this._defaultCircleColor)
          .style('opacity', 1);
        break;
      case 1:
        this._svg.style('opacity', 1);
        d3.select('.viz').style('position', 'fixed');
        this._context.clearRect(0, 0, this._width, this._height);
        this._gGenderLabels.style('opacity', 1);
        this._gYearLabels.style('opacity', 0);
        var genderColors = this._genderColors;
        this._circles
          .attr('r', 8)
          .style('fill', function (d) { 
            var color = genderColors.UNKNOWN;
            if (d.gender) {
              color = genderColors[d.gender]; 
            }
            return color;
          })
          .style('opacity', 1);
        break;
      case 2:
        this._svg.style('opacity', 1);
        d3.select('.viz').style('position', 'fixed');
        this._context.clearRect(0, 0, this._width, this._height);
        this._gGenderLabels.style('opacity', 0);
        this._gYearLabels.style('opacity', 0);
        this._circles
          .attr('r', 8)
          .style('fill', this._defaultCircleColor);
        this._circles.transition().duration(2000)
          .style('opacity', function(d) { 
            if (!d.recentThread) {
              return 0.1;
            }
            var dt = new Date(d.recentThread.ts * 1000);
            if (dt.getFullYear() === 2015 && dt.getMonth() + 1 >= 6) {
              return 1;
            }
            return 0.1;
          });
        break;
      case 3:
        this._svg.style('opacity', 1);
        d3.select('.viz').style('position', 'fixed');
        this._context.clearRect(0, 0, this._width, this._height);
        this._gGenderLabels.style('opacity', 0);
        this._gYearLabels.style('opacity', 1);
        this._circles
          .attr('r', 8)
          .style('fill', this._defaultCircleColor)
          .style('opacity', function(d) { 
            if (!d.recentThread) {
              return 0.1;
            }
            var dt = new Date(d.recentThread.ts * 1000);
            if (dt.getFullYear() === 2015 && dt.getMonth() + 1 >= 6) {
              return 1;
            }
            return 0.1;
          });
        break;
      case 4:
        this._svg.style('opacity', 0);
        d3.select('.viz').style('position', 'fixed');
        break;
      case 5:
        d3.select('.viz').style('position', 'relative');
      default:
        break;
    }
  },

  _tick: function(e) {
    switch (this._currentStage) {
      case 1:
        this._circles.each(this._moveToGenderCenter(e.alpha, this));
        this._initGenderClusterBoxes();
        this._circles.each(this._calculateGenderClusterBoxes(this));
        this._genderLabels
          .attr('x', function(d) { return (d.x2 + d.x1) / 2; })
          .attr('y', function(d) { return d.y1 - 20; })
        break;
      case 3:
        this._circles.each(this._moveToFriendYearCenter(e.alpha, this));
        this._initYearClusterBoxes();
        this._circles.each(this._calculateYearClusterBoxes(this));
        this._yearLabels
          .attr('x', function(d) { return (d.x2 + d.x1) / 2; })
          .attr('y', function(d) { return d.y1 - 5; })
        break;
      case 4:
        this._context.clearRect(0, 0, this._width, this._height);
        this._gGenderLabels.style('opacity', 0);
        this._gYearLabels.style('opacity', 0);
        var sel = this;
        this._links.forEach(function(link) {
          sel._context.beginPath();
          sel._context.moveTo(link.source.x, link.source.y);
          sel._context.lineTo(link.target.x, link.target.y);
          sel._context.lineWidth = 1;
          sel._context.strokeStyle = sel._defaultLineColor;
          sel._context.stroke();
        });
        this._nodes.forEach(function(node) {
          if (!node.recentThread) {
            sel._context.globalAlpha = 0.2;
          } else {
            var dt = new Date(node.recentThread.ts * 1000);
            if (dt.getFullYear() === 2015 && dt.getMonth() + 1 >= 6) {
              sel._context.globalAlpha = 1;
            } else {
              sel._context.globalAlpha = 0.2;
            }
          }
          sel._context.beginPath();
          sel._context.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
          sel._context.fillStyle = sel._defaultCircleColor;
          sel._context.fill();
          sel._context.lineWidth = 1;
          sel._context.strokeStyle = 'white';
          sel._context.stroke();
        });
      default:
        break;
    }
    this._circles
      .attr('cx', function(d) { return d.x; })
      .attr('cy', function(d) { return d.y; })
  },

  _moveToGenderCenter: function(alpha, sel) {
    return function(d) {
      var center = sel._genderCenters.UNKNOWN;
      if (d.gender) {
        center = sel._genderCenters[d.gender];
      } 
      d.x += (center.x - d.x) * 0.1 * alpha;
      d.y += (center.y - d.y) * 0.1 * alpha;
    };
  },

  _initGenderClusterBoxes: function() {
    for (var key in this._genderClusterBoxes) {
      this._genderClusterBoxes[key].x1 = this._chartWidth;
      this._genderClusterBoxes[key].x2 = 0;
      this._genderClusterBoxes[key].y1 = this._chartHeight;
      this._genderClusterBoxes[key].y2 = 0;
    }
  },

  _calculateGenderClusterBoxes: function(sel) {
    return function(d) {
      var key = 'UNKNOWN';
      if (d.gender) {
        key = d.gender;
      }
      if (d.x < sel._genderClusterBoxes[key].x1) {
        sel._genderClusterBoxes[key].x1 = d.x;
      }
      if (d.x > sel._genderClusterBoxes[key].x2) {
        sel._genderClusterBoxes[key].x2 = d.x;
      }
      if (d.y < sel._genderClusterBoxes[key].y1) {
        sel._genderClusterBoxes[key].y1 = d.y;
      }
      if (d.y > sel._genderClusterBoxes[key].y2) {
        sel._genderClusterBoxes[key].y2 = d.y;
      }
    };
  },

  _moveToFriendYearCenter: function(alpha, sel) {
    return function(d) {
      var center = sel._friendYearCenters.UNKNOWN;
      if (d.time_became_friend !== undefined) {
        var year = d.time_became_friend.split('-')[0];
        if (parseInt(year) >= 2011) {
          center = sel._friendYearCenters[year];
        }
      }
      d.x += (center.x - d.x) * 0.1 * alpha;
      d.y += (center.y - d.y) * 0.1 * alpha;
    };
  },

  _initYearClusterBoxes: function() {
    for (var key in this._yearClusterBoxes) {
      this._yearClusterBoxes[key].x1 = this._chartWidth;
      this._yearClusterBoxes[key].x2 = 0;
      this._yearClusterBoxes[key].y1 = this._chartHeight;
      this._yearClusterBoxes[key].y2 = 0;
    }
  },

  _calculateYearClusterBoxes: function(sel) {
    return function(d) {
      var key = 'UNKNOWN';
      if (d.time_became_friend !== undefined) {
        var year = d.time_became_friend.split('-')[0];
        if (parseInt(year) >= 2011) {
          key = year;
        }
      }
      if (d.x < sel._yearClusterBoxes[key].x1) {
        sel._yearClusterBoxes[key].x1 = d.x;
      }
      if (d.x > sel._yearClusterBoxes[key].x2) {
        sel._yearClusterBoxes[key].x2 = d.x;
      }
      if (d.y < sel._yearClusterBoxes[key].y1) {
        sel._yearClusterBoxes[key].y1 = d.y;
      }
      if (d.y > sel._yearClusterBoxes[key].y2) {
        sel._yearClusterBoxes[key].y2 = d.y;
      }
    };
  },

  _collide: function(node) {
    var r = 16,
        nx1 = node.x - r,
        nx2 = node.x + r,
        ny1 = node.y - r,
        ny2 = node.y + r;
    return function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== node)) {
        var x = node.x - quad.point.x,
            y = node.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = 16;
        if (l < r) {
          l = (l - r) / l * .5;
          node.x -= x *= l;
          node.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
  },

  _onClick: function(d) {
    this._tooltip.text(d.name);
  },

  _onMouseover: function(node) {
    this._tooltip.text(node.name)
      .style('opacity', 1)
      .style('position', 'fixed')
      .style('top', d3.event.pageY - window.scrollY + 'px')
      .style('left', d3.event.pageX - window.scrollX + 'px');

    if (this._lines) {
      this._lines.each(function(d) {
        if (d.source.id === node.id || d.target.id === node.id) {
          d3.select(this).style('stroke', '#111');
        } else {
          d3.select(this).style('opacity', 0.1);
        }
      });
    }
  },

  _onMouseout: function() {
    this._tooltip.text('').style('opacity', 0);
    if (this._lines) {
      this._lines
        .style('stroke', 'lightgray')
        .style('opacity', 1);
    }
  },

  _onDragStart: function(d) {
    d3.event.sourceEvent.stopPropagation(); 
  },

  _onDrag: function(d) {
    d3.event.sourceEvent.stopPropagation(); 
    d3.select(this)
      .attr("cx", d.x = d3.event.x)
      .attr("cy", d.y = d3.event.y);
  },

  _onZoom: function() {
    this._gCircles.attr(
      "transform", 
      "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"
    );
    this._gLines.attr(
      "transform", 
      "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"
    );
  },           

  render: function() {
    return <div className={'viz'} ref='chart' />;
  }
});

module.exports = Viz;

