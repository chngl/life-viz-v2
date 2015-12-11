var ForceLayoutViz = require('./ForceLayoutViz');
var React = require('react');
var Store = require('../flux/LifeVizDataStore');

var VizContainer = React.createClass({

  getInitialState: function() {
    return {currentStage: 0};
  },

  componentWillMount: function() {
    Store.addChangeListener(this._onStageChange); 
  },

  componentWillUnmount: function() {
    Store.removeChangeListener(this._onStageChange);
  },

  _onStageChange: function() {
    this.setState({currentStage: Store.getCurrentStage()});
  },

  render: function() {
    switch (this.state.currentStage) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
        return <ForceLayoutViz currentStage={this.state.currentStage} />; 
        break;
      default:
        return <div className={'viz'}>Under Construction...</div>;
    }
  }
});

module.exports = VizContainer;

