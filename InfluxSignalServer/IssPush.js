var dispatcher = require('.//dispatcher');

function IssPush() {
}

IssPush.wsInit = function(wss, userMap) {
  wss.userMap = userMap;

  wss.broadcast = function(data) {
    if (typeof data !== 'string'){
	  data = JSON.stringify(data);
	}
    for(var i in this.clients)
        this.clients[i].send(data);
  };
  
  wss.unicast = function (userid, data){
    if (typeof data !== 'string'){
	  data = JSON.stringify(data);
	}
    var socket = userMap.get(userid).socket;
    socket.send(data);
  }
  
  wss.on('connection', function(ws) {
    var that = this;
    console.log('connected.');
    ws.on('message', function(message) {
      var msg = JSON.parse(message);
	  var signal = msg.signal;
	  
	  if (signal === 'login'){
	    var user = that.userMap.get(msg.id);
	    user.socket = ws;
	    var bMsg = {
	      "signal": "loggedIn",
		  "username": user.name,
		  "uid": user.id
	    };
	    that.broadcast(JSON.stringify(bMsg));
	  }
    });
  });
  
  return wss;
}

module.exports = IssPush;