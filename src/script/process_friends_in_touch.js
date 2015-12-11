var fs = require('fs');
var htmlparser = require("htmlparser2");

// get Year-Month from a unix timestamp
function getTime(ts) {
  var dt = new Date(ts * 1000);
  return dt.getFullYear() + '-' + (dt.getMonth() + 1);
}

var html = fs.readFileSync('friends_in_touch.html', 'utf8');
var inTouchFriends = {};
var handler = new htmlparser.DomHandler(function (error, elements) {
  var list = elements[0].children;
  list.forEach(function (li) {
    var id = li.attribs.id;
    if (id.indexOf('user') < 0) {
      return;
    }
    var friendID = id.split(':')[2];
    var ts = li.children[0].children[1].children[0].children[1].children[1].attribs['data-utime'];
    inTouchFriends[friendID] = {
      id: friendID,
      ts: ts,
      date: getTime(ts),
    };
  });
  fs.writeFile('friends_in_touch.JSON', JSON.stringify(inTouchFriends));
});

var parser = new htmlparser.Parser(handler);
parser.write(html);
parser.done();

