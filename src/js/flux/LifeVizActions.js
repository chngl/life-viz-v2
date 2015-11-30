var LifeVizDispatcher = require('./LifeVizDispatcher');
var LifeVizConstants = require('./LifeVizConstants');

var ActionTypes = LifeVizConstants.ActionTypes;

module.exports = {
  moveToNewStage: function(currentStage) {
    LifeVizDispatcher.dispatch({
      type: ActionTypes.MOVE_TO_NEW_STAGE,
      data: {currentStage: currentStage},
    });
  }
};
