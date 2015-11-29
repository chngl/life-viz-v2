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

  stages: [
    {title: 'stage1', text: 'This is stage1.'}, 
    {title: 'stage2', text: 'This is stage2.'}, 
    {title: 'stage3', text: 'This is stage3.'}, 
  ],

  componentDidMount: function() {
    console.log('mounted');
  },

  render: function(){
    return (
      React.createElement("div", {className: 'scroller'}, 
        
          this.stages.map(function(stage) { 
            return (
              React.createElement("section", {className: 'stage'}, 
                React.createElement("div", {className: 'title'}, stage.title), 
                React.createElement("p", {className: 'main-text'}, stage.text)
              )
            );
          })
        
      )
    );
  }
});

module.exports = Scroller;

},{}],"/Users/changfb/Documents/life-viz-v2/src/js/components/Viz.js":[function(require,module,exports){
var Viz = React.createClass({displayName: "Viz",
  render: function(){
    return React.createElement("div", {className: 'viz'});
  }
});

module.exports = Viz;

},{}],"/Users/changfb/Documents/life-viz-v2/src/js/main.js":[function(require,module,exports){
var App = require('./components/App');

React.render(React.createElement(App, null), document.getElementById('app'));

},{"./components/App":"/Users/changfb/Documents/life-viz-v2/src/js/components/App.js"}]},{},["/Users/changfb/Documents/life-viz-v2/src/js/main.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2hhbmdmYi9Eb2N1bWVudHMvbGlmZS12aXotdjIvc3JjL2pzL2NvbXBvbmVudHMvQXBwLmpzIiwiL1VzZXJzL2NoYW5nZmIvRG9jdW1lbnRzL2xpZmUtdml6LXYyL3NyYy9qcy9jb21wb25lbnRzL1Njcm9sbGVyLmpzIiwiL1VzZXJzL2NoYW5nZmIvRG9jdW1lbnRzL2xpZmUtdml6LXYyL3NyYy9qcy9jb21wb25lbnRzL1Zpei5qcyIsIi9Vc2Vycy9jaGFuZ2ZiL0RvY3VtZW50cy9saWZlLXZpei12Mi9zcmMvanMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNyQyxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRTNCLElBQUkseUJBQXlCLG1CQUFBO0VBQzNCLE1BQU0sRUFBRSxVQUFVO0lBQ2hCO01BQ0Usb0JBQUEsS0FBSSxFQUFBLElBQUMsRUFBQTtRQUNILG9CQUFDLFFBQVEsRUFBQSxJQUFBLENBQUcsQ0FBQSxFQUFBO1FBQ1osb0JBQUMsR0FBRyxFQUFBLElBQUEsQ0FBRyxDQUFBO01BQ0gsQ0FBQTtNQUNOO0dBQ0g7QUFDSCxDQUFDLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQzs7O0FDZHJCLElBQUksOEJBQThCLHdCQUFBOztFQUVoQyxNQUFNLEVBQUU7SUFDTixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixDQUFDO0lBQzFDLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLENBQUM7SUFDMUMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxpQkFBaUIsQ0FBQztBQUM5QyxHQUFHOztFQUVELGlCQUFpQixFQUFFLFdBQVc7SUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMzQixHQUFHOztFQUVELE1BQU0sRUFBRSxVQUFVO0lBQ2hCO01BQ0Usb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxVQUFZLENBQUEsRUFBQTtRQUN6QjtVQUNDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsS0FBSyxFQUFFO1lBQzlCO2NBQ0Usb0JBQUEsU0FBUSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxPQUFTLENBQUEsRUFBQTtnQkFDM0Isb0JBQUEsS0FBSSxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBRSxPQUFTLENBQUEsRUFBQyxLQUFLLENBQUMsS0FBWSxDQUFBLEVBQUE7Z0JBQzVDLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUUsV0FBYSxDQUFBLEVBQUMsS0FBSyxDQUFDLElBQVMsQ0FBQTtjQUNuQyxDQUFBO2NBQ1Y7V0FDSDtRQUNGO01BQ0csQ0FBQTtNQUNOO0dBQ0g7QUFDSCxDQUFDLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQzs7O0FDOUIxQixJQUFJLHlCQUF5QixtQkFBQTtFQUMzQixNQUFNLEVBQUUsVUFBVTtJQUNoQixPQUFPLG9CQUFBLEtBQUksRUFBQSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUUsS0FBTSxDQUFBLENBQUcsQ0FBQSxDQUFDO0dBQ2xDO0FBQ0gsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7OztBQ05yQixJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7QUFFdEMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxvQkFBQyxHQUFHLEVBQUEsSUFBQSxDQUFHLENBQUEsRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFNjcm9sbGVyID0gcmVxdWlyZSgnLi9TY3JvbGxlcicpO1xudmFyIFZpeiA9IHJlcXVpcmUoJy4vVml6Jyk7XG5cbnZhciBBcHAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHJlbmRlcjogZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj4gXG4gICAgICAgIDxTY3JvbGxlciAvPlxuICAgICAgICA8Vml6IC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcHA7XG5cbiIsInZhciBTY3JvbGxlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBzdGFnZXM6IFtcbiAgICB7dGl0bGU6ICdzdGFnZTEnLCB0ZXh0OiAnVGhpcyBpcyBzdGFnZTEuJ30sIFxuICAgIHt0aXRsZTogJ3N0YWdlMicsIHRleHQ6ICdUaGlzIGlzIHN0YWdlMi4nfSwgXG4gICAge3RpdGxlOiAnc3RhZ2UzJywgdGV4dDogJ1RoaXMgaXMgc3RhZ2UzLid9LCBcbiAgXSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ21vdW50ZWQnKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXsnc2Nyb2xsZXInfT4gXG4gICAgICAgIHtcbiAgICAgICAgICB0aGlzLnN0YWdlcy5tYXAoZnVuY3Rpb24oc3RhZ2UpIHsgXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9eydzdGFnZSd9PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXsndGl0bGUnfT57c3RhZ2UudGl0bGV9PC9kaXY+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPXsnbWFpbi10ZXh0J30+e3N0YWdlLnRleHR9PC9wPlxuICAgICAgICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjcm9sbGVyO1xuXG4iLCJ2YXIgVml6ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXI6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPXsndml6J30gLz47XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpejtcblxuIiwidmFyIEFwcCA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9BcHAnKTtcblxuUmVhY3QucmVuZGVyKDxBcHAgLz4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHAnKSk7XG5cbiJdfQ==
