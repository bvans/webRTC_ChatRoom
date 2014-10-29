/**
 * Created by fengyun on 2014/10/15.
 */

//Obviously the callee accept the offer

var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('./log.js').logger;

function ice_candidate(request,response) {
    logger.info("Request handler 'ice_candidate' was called.");

   /*  var ices = JSON.parse(request.body['ices']);
	var senderId = tokenManage.validateToken(ices[0].token,'');
	request.body['caller_id'] = ices[0].caller_id;
	request.body['callee_id'] = ices[0].callee_id; */
	
	var senderId = tokenManage.validateToken(request.body['token'],'');
    if(!senderId){
        response.send(404);
        return;
    }

    var receiverId = '';
    if(senderId === request.body['caller_id']){
        receiverId = request.body['callee_id'];
    }else if(senderId === request.body['callee_id']){
        receiverId = request.body['caller_id'];
    }
    //var recRes = null;

    //find rec res
    var receiver = dispatcher.userMap.get(receiverId);

    if(receiver === undefined){//caller is except exit
        //callee is backup status
        response.send(404);
        return;
    }
	
	setTimeout(sendIce, 500);
	function sendIce(){
	  var recRes = dispatcher.userMap.get(receiverId).res;
      recRes.set({
          //'Content-Type': 'multipart/x-mixed-replace',
	  	'Content-Type': 'text/html',
          'boundary' : '--INFLUX_WEBRTC_SIGNAL_BOUNDARY--'
      });
      var jsObj = {
        'caller_id' : request.body['caller_id'],
        'callee_id' : request.body['callee_id'],
        'signal'    : 'ice_candidate',
        'content'   : request.body['ice_candidate']
      }
	  recRes.send(JSON.stringify(jsObj));
	}
    
	
	
	
    /* var jsObj = {
        'caller_id' : request.body['caller_id'],
        'callee_id' : request.body['callee_id'],
        'signal'    : 'ice_candidate',
        'content'   : request.body['ice_candidate']
    }

    var jsonStr = JSON.stringify(jsObj);
    jsonStr += '\n';
    recRes.send(jsonStr);
 */
 
    
    response.send(200);
}

exports.ice_candidate = ice_candidate;