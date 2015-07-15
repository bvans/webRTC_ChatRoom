var dispatcher = require('./dispatcher');
var tokenManage = require('./token_manage.js');
var logger = require('../../lib/log.js').logger,
global = require('../common/errorCode.js').global;
function IssPush() {
}

IssPush.wsInit = function(wss, userMap) {
  wss.userMap = userMap;

  wss.broadcast = function(data) {
    if (typeof data !== 'string'){
	  data = JSON.stringify(data);
	}
    for(var i in this.clients)
	  if (!clients[i].socket.OPEN) {
	    return;
	  }
	  this.clients[i].socket.send(data);
  };
  
  wss.unicast = function (userid, data){
    if (typeof data !== 'string'){
	  data = JSON.stringify(data);
	}
    var user = userMap.get(userid);
    if(user === undefined){
        return;
    }
	if (user.socket === null) {
	    return;
	}
    try{
        user.socket.send(data);
    }catch (e){
        logger.error('socket can not opened');
        user.socket = null;
    }
  }
  
  wss.on('connection', function(ws) {
  
    var that = this;
    ws.on('message', function(message) {
      message = JSON.parse(message);
	  
	  if (message.signal === 'registry'){
	    var user = that.userMap.get(message.id);
        if(user === undefined){
            return;
        }
	    user.socket = ws;
	  }
	  else if (message.signal === 'ice_candidate'){
	    var senderId = tokenManage.validateToken(message.token,'');
        if(!senderId){
            console.log('ice error by token failure');
            that.unicast(senderId,JSON.stringify({"error":
            {
                code: global.ERROR_TOKEN,
                reason: 'token failure'
            }}));
            return;
        }
		else if (senderId === message.caller_id){
		  that.unicast(message.callee_id, JSON.stringify({
		    'caller_id': message.caller_id,
			'callee_id': message.callee_id,
			'signal': 'ice_candidate',
			'content': message.content
		  }));
		}
	    else if (senderId === message.callee_id){
		  that.unicast(message.caller_id,JSON.stringify({
		    'caller_id': message.caller_id,
			'callee_id': message.callee_id,
			'signal': 'ice_candidate',
			'content': message.content
		  }));
		}
	  }
    });

    ws.on('close', function() {
        for(x in dispatcher.userMap.keySet() ){
            var element = dispatcher.userMap.get(dispatcher.userMap.keySet()[x]);
            if(element.socket === ws){
                logger.warn(element.name + '-client: close');
                dispatcher.userMap.remove(element.id);
                return;
            }
        }
        ws = null;
    });

    ws.on('error', function() {
        for(x in dispatcher.userMap.keySet() ){
            var element = dispatcher.userMap.get(dispatcher.userMap.keySet()[x]);
            if(element.socket === ws){
                logger.error(element.name + '-client: exp quit');
                dispatcher.userMap.remove(element.id);
                return;
            }
        }
        ws = null;
    });

  });
  
  
  return wss;
}

module.exports = IssPush;