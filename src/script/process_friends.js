var csv = require("fast-csv");
var fs = require('fs');

// get Year-Month from a unix timestamp
function getTime(ts) {
  var dt = new Date(ts * 1000);
  return dt.getFullYear() + '-' + (dt.getMonth() + 1);
}

// add findIndex function to Array
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}

var inTouchFriends = JSON.parse(fs.readFileSync('friends_in_touch.JSON', 'utf8'));
// main function to generate the data
function generateFriendsData() {
  var friendsNodes = [];
  var friendsLinks = [];

  var friends = {};
  var obj = JSON.parse(fs.readFileSync('friends_raw_data.txt', 'utf8'));
  obj['1344091883'].friends.nodes.forEach(function(node) {
    friends[node.id] = node; 
    if (node.id in inTouchFriends) {
      friends[node.id].recentThread = inTouchFriends[node.id];
    } else {
      friends[node.id].recentThread = undefined;
    }
  });

  csv.fromPath('./friends_friending_time.csv', {headers : ['id', 'initiated', 'time', 'name']})
    .on('data', function(data) {
      if (data.id in friends) {
        friends[data.id].time_became_friend  = getTime(data.time);
      }
    })
    .on('end', function() {
      for (var id in friends) {
        friendsNodes.push(friends[id]);
      }
      friendsLinks = generateFriendsLinks(friendsNodes);
      fs.writeFile('friends_nodes_links.JSON', JSON.stringify({
        nodes: friendsNodes, 
        links: friendsLinks,
      }, null, 2));
    });
}

function generateFriendsLinks(friendsNodes) {
  obj = JSON.parse(fs.readFileSync('friends_mutual_friends.txt', 'utf8'));
  var friendsLinks = [];
  var processedFriends = {};
  obj['1344091883'].friends.nodes.forEach(function(node) {
    var srcFriendID = node.id;
    processedFriends[srcFriendID] = 1;
    var mutualFriends = node.mutual_friends.nodes;
    mutualFriends.forEach(function(mutualFriend) {
      var tgtFriendID = mutualFriend.id;
      if (tgtFriendID in processedFriends) {
        return;
      }
      var link = {
        source: srcFriendID,
        target: tgtFriendID,
      };
      friendsLinks.push(link);
    });
  });

  friendsLinks.forEach(function(link) {
    var srcIdx = friendsNodes.findIndex(function(node) {
      return node.id === link.source;
    });  
    var tgtIdx = friendsNodes.findIndex(function(node) {
      return node.id === link.target;
    });
    if (srcIdx < 0 || tgtIdx < 0) {
      console.log(link);
      return;
    } 
    link.source = srcIdx; 
    link.target = tgtIdx; 
  });

  return friendsLinks;
}

generateFriendsData();

