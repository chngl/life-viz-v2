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
  _friendImg: null,
  _genderLabels: null,
  _yearLabels: null,
  _gCircles: null,
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

    this._gCircles = this._svg.append('g');
    this._gGenderLabels = this._svg.append('g');
    this._gYearLabels = this._svg.append('g');
    this._friendImg = this._svg.append('image')
      .style('opacity', 0)
      .attr('xlink:href', 'assets/friends-small.jpg')
      .attr('x', '0px')
      .attr('y', '0px')
      .attr('width', '800px')
      .attr('height', '600px');

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

    this._circles = this._gCircles.selectAll('circle').data(this._nodes)
      .enter().append('circle')
      .style('stroke', 'white');

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
    // reset force based on differnt stages
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

    this._svg.style('opacity', 1);
    this._gCircles.style('opacity', 1);
    this._friendImg.style('opacity', 0);
    this._context.clearRect(0, 0, this._width, this._height);
    this._gGenderLabels.style('opacity', 0);
    this._gYearLabels.style('opacity', 0);

    // set other configerations based on stage
    switch (this._currentStage) {
      case 0:
        this._circles
          .attr('r', 8)
          .style('fill', this._defaultCircleColor)
          .style('opacity', 1);
        break;
      case 1:
        this._gGenderLabels.style('opacity', 1);
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
        this._circles
          .attr('r', 8)
          .style('fill', this._defaultCircleColor);
        this._circles.transition().duration(2000)
          .style('opacity', function(d) { 
            if (!d.recent_thread_ts) {
              return 0.1;
            }
            var dt = new Date(d.recent_thread_ts * 1000);
            if (dt.getFullYear() === 2015 && dt.getMonth() + 1 >= 6) {
              return 1;
            }
            return 0.1;
          });
        break;
      case 3:
        this._gYearLabels.style('opacity', 1);
        this._circles
          .attr('r', 8)
          .style('fill', this._defaultCircleColor)
          .style('opacity', function(d) { 
            if (!d.recent_thread_ts) {
              return 0.1;
            }
            var dt = new Date(d.recent_thread_ts * 1000);
            if (dt.getFullYear() === 2015 && dt.getMonth() + 1 >= 6) {
              return 1;
            }
            return 0.1;
          });
        break;
      case 4:
        this._svg.style('opacity', 0);
        break;
      case 5:
        this._friendImg
          .transition()
          .duration(1000)
          .style('opacity', 1);
        this._gCircles.style('opacity', 0);
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
          if (!node.recent_thread_ts) {
            sel._context.globalAlpha = 0.2;
          } else {
            var dt = new Date(node.recent_thread_ts * 1000);
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
      if (d.time_became_friends !== undefined) {
        var year = d.time_became_friends.split('-')[0];
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
      if (d.time_became_friends !== undefined) {
        var year = d.time_became_friends.split('-')[0];
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

  render: function() {
    return <div className={'viz'} ref='chart' />;
  }
});

module.exports = Viz;

