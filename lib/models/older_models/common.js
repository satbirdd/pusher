var redis       = require('redis'),
    fs          = require('fs'),
    db_filename = './database.json',
    nohm        = require('nohm').Nohm,
    client      = redis.createClient(db.port, db.host);

var db = JSON.parse(fs.readFileSync(db_filename));

while(!client.connected) {

}

console.log(client.)
client.on('connect', function(){
  if (db.select != null) {
    client.select(db.select); // or something
  }

  nohm.setPrefix(db.namespace || 'Test');
  nohm.setClient(client);
});

var init = function(){
  if (typeof global.redisClient === 'undefined') {
    global.redisClient = redis.createClient(db.port, db.host);
    nohm.setPrefix('Caramal');
    nohm.setClient(redis);
  }
  return nohm;
}


exports.init = init;