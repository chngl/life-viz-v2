var App = require('./components/App');
var React = require('react');
var ReactDOM = require('react-dom');

window.onload = function() {
  setTimeout(function() {
    window.scrollTo(0, 0);
    ReactDOM.render(<App />, document.getElementById('app'));
  }, 15);
};
