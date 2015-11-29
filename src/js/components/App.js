var Scroller = require('./Scroller');
var Viz = require('./Viz');

var App = React.createClass({
  render: function(){
    return (
      <div> 
        <Scroller />
        <Viz />
      </div>
    );
  }
});

module.exports = App;

