var Store = require('../flux/LifeVizDataStore');

var Viz = React.createClass({

  getInitialState: function() {
    return {currentStage: 0};
  },

  componentDidMount: function() {
    Store.addChangeListener(this._onStageChange); 
  },

  componentWillUnmount: function() {
    Store.removeChangeListener(this._onStageChange);
  },

  _onStageChange: function() {
    this.setState({currentStage: Store.getCurrentStage()}); 
  },

  render: function(){
    return <div className={'viz'} >{this.state.currentStage}</div>;
  }
});

module.exports = Viz;

