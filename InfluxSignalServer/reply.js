/**
 * Created by fengyun on 2014/10/15.
 */

//Obviously the callee accept the offer

var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('./log.js').logger;

function reply(request,response) {
    logger.info("Request handler 'reply' was called.");

    if(!tokenManage.validateToken(request.body['token'],request.body['callee_id'])){
        response.send(404);
    }

    var callerRes = null;

    //find caller,and answer sdp
    callerRes = dispatcher.userMap.get(request.body['caller_id']).res;

    if(callerRes === null){//caller is except exit
        //callee is backup status
        dispatcher.userMap.get(request.body['callee_id']).status = dispatcher.status['Idle'];
        response.send(404);
        return;
    }

    callerRes.set({
        //'Content-Type': 'multipart/x-mixed-replace',
		'Content-Type': 'text/html',
        'boundary' : '--INFLUX_WEBRTC_SIGNAL_BOUNDARY--'
    });

    var jsObj = {
        'caller_id' : request.body['caller_id'],
        'callee_id' : request.body['callee_id'],
        'signal'    : 'answer',
        'content'   : request.body['sdp']
    }
    var jsonStr = JSON.stringify(jsObj);
    jsonStr += '\n';
    callerRes.send(jsonStr);

    //callee' status have changed ->busy
    dispatcher.userMap.get(request.body['callee_id']).status = dispatcher.status['Busy'];

    //emit a event for answer
    var eventName = 'call_ack' + '_' + request.body['caller_id'];
    dispatcher.emitter.emit(eventName,dispatcher.EVENT_TYPE.SPEAK);

    //if callee shut down
//    response.on('close', function(data) {
//        dispatcher.userMap.remove(request.body['callee_id']);
//        response.send(404);
//    });

    response.send(200);
}

exports.reply = reply;