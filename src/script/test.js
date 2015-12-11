var fs = require('fs');

var friends = JSON.parse(fs.readFileSync('processed.txt', 'utf8'));
for (var id in friends) {
  console.log(friends[id]);
}
