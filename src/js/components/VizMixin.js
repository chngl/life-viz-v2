var ReactDOM = require('react-dom');
var _ = require('underscore');

var d3 = require('d3');
var invariant = require('invariant');

/**
 * All d3 visualization should include this mixin. In each d3 Viz:
 * 1. create a <div ref='chart' />
 * 2. implement an _render function to render the viz
 * 3. optionally implement an _update function to handle transition when props
 *    update
 */
var VizMixin = {

  _node: null,
  _svg: null,
  _context: null,
  _margin: null,
  _width: 0,
  _height: 0,
  _chartWidth: 0,
  _chartHeight: 0,
  _listener: null,
  _shouldUpdate: false,

  componentDidMount: function() {
    this._setup();
    this._init();
    this._render();
    window.addEventListener('resize', this._onResize, false);
  },

  componentDidUpdate: function() {
    if (this._shouldUpdate) {
      this._triggerUpdate();
    }
  },

  componentWillUnmount: function() {
    d3.select(this._node).selectAll('*').remove();
    window.removeEventListener('resize', this._onResize, false);
  },

  /**
   * remove everything from the container
   * create an empty svg element in the container
   */
  _setup: function() {
    this._node = ReactDOM.findDOMNode(this.refs.chart);
    invariant(this._node !== null, ' Container not found, forgot "ref=chart"?');
    d3.select(this._node).selectAll('*').remove();
    this._svg = d3.select(this._node).append('svg');
    this._canvas = d3.select(this._node).append('canvas');
  },

  /**
   * calculate the width/height/chartWidth/chartHeight for SVG and chart area.
   */
  _init: function() {
    this._margin = this.props.margin || {top: 20, right: 20, bottom: 20, left: 20};
    this._width = this.props.width || this._node.offsetWidth;
    this._height = this.props.height || this._node.offsetHeight;
    this._chartWidth = this._width - this._margin.left - this._margin.right;
    this._chartHeight = this._height - this._margin.top - this._margin.bottom;
    this._svg
      .attr('width', this._width)
      .attr('height', this._height);
    this._canvas
      .attr('width', this._width)
      .attr('height', this._height)
      .style('top', -this._height + 'px')
      .style('position', 'relative');
    this._context = this._canvas.node().getContext("2d"); 
    //this._cvs = new fabric.Canvas(this._canvas.node(), {renderOnAddRemove: false,  backgroundColor: "#000" });
  },

  _onResize: function() {
    this._triggerUpdate();
  },

  _triggerUpdate: function() {
    // if use defines a _update function, will apply this function.
    // this is to proivde user the chance to do the transition instead of
    // re-rendering everthing. It also has better performance, since the viz
    // doesn't have to be cleared and re-rendered from scratch
    if (this._update) {
      this._init();
      this._update();
    // if user doesn't have a _update function, will remove everything and call
    // the _render again to make sure everything is still right after any of
    // the updates. Though this way, it has worse performance
    } else {
      this._setup();
      this._init();
      this._render();
    }
  },
};

module.exports = VizMixin;
