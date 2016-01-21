var Viz = require('./Viz');
var React = require('react');
var Scroller = require('./Scroller');

var stages = require('./StageInfo'); 

var App = React.createClass({
  render: function(){
    return (
      <div>
      <div className={'container-fluid'}> 
        <div className={'row'}>
          <div className={'col-md-1'}></div>
          <div className={'col-md-10'}>
            <Scroller stages={stages} />
            <Viz currentStage={0} />
          </div>
          <div className={'col-md-1'}></div>
        </div>
      </div>
      <div className={'container-fluid footer'}>
        <p className={'text-muted'}>Chang Liu. 2015</p>
      </div>
      </div>
    );
  }
});

module.exports = App;
