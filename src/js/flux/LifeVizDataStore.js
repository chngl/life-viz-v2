var EventEmitter = require('events').EventEmitter;
var LifeVizConstants = require('./LifeVizConstants');
var LifeVizDispatcher = require('./LifeVizDispatcher');

var assign = require('object-assign');

var ActionTypes = LifeVizConstants.ActionTypes;
var CHANGE_EVENT = 'change';

var _currentStage = 0;
var _data = [1, 2];

var LifeVizDataStore = assign({}, EventEmitter.prototype, {

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  getCurrentStage: function() {
    return _currentStage;
  },

  getCurrentStageData: function() {
    return _data[_currentStage];
  },
});

LifeVizDataStore.dispatchToken = LifeVizDispatcher.register(function(action) {

  switch(action.type) {
    case ActionTypes.MOVE_TO_NEW_STAGE:
      _currentStage = action.data.currentStage;
      LifeVizDataStore.emitChange();
      break;
    default:
      // do nothing
  }
});

module.exports = LifeVizDataStore;
