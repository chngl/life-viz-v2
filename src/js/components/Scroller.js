var Actions = require('../flux/LifeVizActions');

var classNames = require('classnames');
var d3 = require('d3');

var Scroller = React.createClass({

  _stages: [
    {
      title: 'March 12, 2015',
      text: 'Yichen is born in Redwood City! I updated to become a DAD!',
    }, 
    {
      title: 'Jun 20, 2015',
      text: 'Yichen is offically 100 days. We had a huge party for him!',
    }, 
  ],

  _stagesPositions: [],
  _containerPosition: 0,

  getInitialState: function() {
    return {currentStage: 0};
  },

  componentDidMount: function() {
    this._getStagesPositions();
    d3.select(window).on("scroll.scroller", this._scroll);
  },

  _getStagesPositions: function() {
    var sel = this;
    d3.selectAll('.stage').each(function(d, i) {
      var top = this.getBoundingClientRect().top;
      if(i === 0) {
        startPos = top;
      }
      sel._stagesPositions.push(top - startPos);
    });
    this._containerPosition = d3.select('.scroller').node().getBoundingClientRect().top + window.pageYOffset;
  },

  _scroll: function() {
    var pos = window.pageYOffset - 10 - this._containerPosition;
    var newStage = d3.bisect(this._stagesPositions, pos);
    newStage = Math.min(this._stages.length - 1, newStage);

    if (this.state.currentStage !== newStage) {
      this.setState({currentStage: newStage});
      Actions.moveToNewStage(newStage);
    }
  },

  render: function() {
    return (
      <div className={'scroller'}> 
        {
          this._stages.map(function(stage, idx) { 
            var cn = classNames({
              'stage': true,
              'transparent': this.state.currentStage !== idx,
              'last-stage': this._stages.length - 1 === idx,
            });
            return (
              <section className={cn}>
                <div className={'title'}>{stage.title}</div>
                <p className={'main-text'}>{stage.text}</p>
              </section>
            );
          }.bind(this))
        }
      </div>
    );
  }
});

module.exports = Scroller;

