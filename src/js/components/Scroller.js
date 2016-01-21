var React = require('react');
var Actions = require('../flux/LifeVizActions');

var classNames = require('classnames');
var d3 = require('d3');
var markdown = require( "markdown" ).markdown;

var Scroller = React.createClass({

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

    if (newStage < this.props.stages.length && this.state.currentStage !== newStage) {
      this.setState({currentStage: newStage});
      Actions.moveToNewStage(newStage);
    }
  },

  render: function() {
    return (
      <div className={'scroller'}> 
        {
          this.props.stages.map(function(stage, idx) { 
            var cn = classNames({
              'stage': true,
              'transparent': this.state.currentStage !== idx,
              'last-stage': this.props.stages.length - 1 === idx,
            });
            var content = markdown.toHTML(stage.text);
            return (
              <section className={cn} key={idx}>
                <div className={'title'}>{stage.title}</div>
                <div className={'main-text'} dangerouslySetInnerHTML={{__html:content}} />
              </section>
            );
          }.bind(this))
        }
      </div>
    );
  }
});

module.exports = Scroller;

