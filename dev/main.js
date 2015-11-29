(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/changfb/Documents/life-viz-v2/src/js/components/App.js":[function(require,module,exports){
var Scroller = require('./Scroller');
var Viz = require('./Viz');

var App = React.createClass({displayName: "App",
  render: function(){
    return (
      React.createElement("div", null, 
        React.createElement(Scroller, null), 
        React.createElement(Viz, null)
      )
    );
  }
});

module.exports = App;

},{"./Scroller":"/Users/changfb/Documents/life-viz-v2/src/js/components/Scroller.js","./Viz":"/Users/changfb/Documents/life-viz-v2/src/js/components/Viz.js"}],"/Users/changfb/Documents/life-viz-v2/src/js/components/Scroller.js":[function(require,module,exports){
var Scroller = React.createClass({displayName: "Scroller",
  render: function(){
    return React.createElement("div", {className: 'scroller'}, " This is the scroller. ");
  }
});

module.exports = Scroller;

},{}],"/Users/changfb/Documents/life-viz-v2/src/js/components/Viz.js":[function(require,module,exports){
var Viz = React.createClass({displayName: "Viz",
  render: function(){
    return React.createElement("div", null, " This is the Viz. ");
  }
});

module.exports = Viz;

},{}],"/Users/changfb/Documents/life-viz-v2/src/js/main.js":[function(require,module,exports){
var App = require('./components/App');

React.render(React.createElement(App, null), document.getElementById('app'));

},{"./components/App":"/Users/changfb/Documents/life-viz-v2/src/js/components/App.js"}]},{},["/Users/changfb/Documents/life-viz-v2/src/js/main.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2hhbmdmYi9Eb2N1bWVudHMvbGlmZS12aXotdjIvc3JjL2pzL2NvbXBvbmVudHMvQXBwLmpzIiwiL1VzZXJzL2NoYW5nZmIvRG9jdW1lbnRzL2xpZmUtdml6LXYyL3NyYy9qcy9jb21wb25lbnRzL1Njcm9sbGVyLmpzIiwiL1VzZXJzL2NoYW5nZmIvRG9jdW1lbnRzL2xpZmUtdml6LXYyL3NyYy9qcy9jb21wb25lbnRzL1Zpei5qcyIsIi9Vc2Vycy9jaGFuZ2ZiL0RvY3VtZW50cy9saWZlLXZpei12Mi9zcmMvanMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNyQyxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRTNCLElBQUkseUJBQXlCLG1CQUFBO0VBQzNCLE1BQU0sRUFBRSxVQUFVO0lBQ2hCO01BQ0Usb0JBQUEsS0FBSSxFQUFBLElBQUMsRUFBQTtRQUNILG9CQUFDLFFBQVEsRUFBQSxJQUFBLENBQUcsQ0FBQSxFQUFBO1FBQ1osb0JBQUMsR0FBRyxFQUFBLElBQUEsQ0FBRyxDQUFBO01BQ0gsQ0FBQTtNQUNOO0dBQ0g7QUFDSCxDQUFDLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQzs7O0FDZHJCLElBQUksOEJBQThCLHdCQUFBO0VBQ2hDLE1BQU0sRUFBRSxVQUFVO0lBQ2hCLE9BQU8sb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxVQUFZLENBQUEsRUFBQSx5QkFBNkIsQ0FBQSxDQUFDO0dBQ2xFO0FBQ0gsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7OztBQ04xQixJQUFJLHlCQUF5QixtQkFBQTtFQUMzQixNQUFNLEVBQUUsVUFBVTtJQUNoQixPQUFPLG9CQUFBLEtBQUksRUFBQSxJQUFDLEVBQUEsb0JBQXdCLENBQUEsQ0FBQztHQUN0QztBQUNILENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDOzs7QUNOckIsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7O0FBRXRDLEtBQUssQ0FBQyxNQUFNLENBQUMsb0JBQUMsR0FBRyxFQUFBLElBQUEsQ0FBRyxDQUFBLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBTY3JvbGxlciA9IHJlcXVpcmUoJy4vU2Nyb2xsZXInKTtcbnZhciBWaXogPSByZXF1aXJlKCcuL1ZpeicpO1xuXG52YXIgQXBwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXI6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+IFxuICAgICAgICA8U2Nyb2xsZXIgLz5cbiAgICAgICAgPFZpeiAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwO1xuXG4iLCJ2YXIgU2Nyb2xsZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHJlbmRlcjogZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9eydzY3JvbGxlcid9PiBUaGlzIGlzIHRoZSBzY3JvbGxlci4gPC9kaXY+O1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JvbGxlcjtcblxuIiwidmFyIFZpeiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyOiBmdW5jdGlvbigpe1xuICAgIHJldHVybiA8ZGl2PiBUaGlzIGlzIHRoZSBWaXouIDwvZGl2PjtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVml6O1xuXG4iLCJ2YXIgQXBwID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL0FwcCcpO1xuXG5SZWFjdC5yZW5kZXIoPEFwcCAvPiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpKTtcblxuIl19
