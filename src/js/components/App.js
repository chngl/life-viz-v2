var ForceLayoutViz = require('./ForceLayoutViz');
var React = require('react');
var Scroller = require('./Scroller');

var stages = require('./StageInfo'); 

var App = React.createClass({
  render: function(){
    return (
      <div className={'container-fluid'}> 
        <div className={'row'}>
          <div className={'col-md-1'}></div>
          <div className={'col-md-10'}>
            <Scroller stages={stages} />
            <ForceLayoutViz currentStage={0} />
          </div>
          <div className={'col-md-1'}></div>
        </div>
        <div className={'row friends-section'}>
          <img src={'assets/friends.jpg'} style={{width: '100%'}} />
          <div className={'friends-title'}>Find some time and talk to your old friends</div>
        </div>
      </div>
    );
  }
});

module.exports = App;
