/**
 * Created by fengyun on 2014/10/15.
 */

var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('./log.js').logger;

function call(request,response) {

    logger.info("Request handler 'call' was called.");

    if(!tokenManage.validateToken(request.body['token'],request.body['caller_id'])){
        response.send(404);
    }

    var calleeRes = null;

    //caller status changed -> ready
    dispatcher.userMap.get(request.body['caller_id']).status = dispatcher.status['Ready'];

    //find callee, and status changed -> ready
    calleeRes = dispatcher.userMap.get(request.body['callee_id']).res;
    if(dispatcher.userMap.get(request.body['callee_id']).status !== dispatcher.status['Idle']){
        response.send(443,'callee is busy now!');//tell caller, callee is busy now（通话中）
        return;
    }
    dispatcher.userMap.get(request.body['callee_id']).status = dispatcher.status['Ready'];

    if(calleeRes === null){
        dispatcher.userMap.get(request.body['caller_id']).status = dispatcher.status['Idle'];
        response.send(404);//in case callee throwing an exception, and quit
        return;
    }

    calleeRes.set({
        //'Content-Type': 'multipart/x-mixed-replace',
		'Content-Type': 'text/html',
        'boundary' : '--INFLUX_WEBRTC_SIGNAL_BOUNDARY--'
    });

    var jsonStr = JSON.stringify({
        'caller_id' : request.body['caller_id'],
        'callee_id' : request.body['callee_id'],
        'signal'    : 'offer',
        'content'   : request.body['sdp']
    });
    jsonStr += '\n';
    calleeRes.send(jsonStr);

    //listen a event for answer
    var eventName = 'call_ack' + '_' + request.body['caller_id'];

    dispatcher.emitter.once(eventName, function (arg){
        if(arg === dispatcher.EVENT_TYPE.SPEAK){
            dispatcher.userMap.get(request.body['caller_id']).status = dispatcher.status['Busy'];
            response.send(200,'已接通，可通话');//tell caller, init call UI
        }else if(arg === dispatcher.EVENT_TYPE.REFUSED){
            dispatcher.userMap.get(request.body['caller_id']).status = dispatcher.status['Idle'];
            response.send(444,'refused by callee!');//tell caller, cancel this conversion
        }
    });

    //timeout for callee exceedingly quit
    response.on('timeout', function(data) {
        dispatcher.userMap.get(request.body['caller_id']).status = dispatcher.status['Idle'];
        response.send(404);//in case callee throwing an exception, and quit(呼叫的对方暂时不能接通)
    });

    //if caller shut down
//    response.on('close', function(data) {
//        dispatcher.userMap.remove(request.body['caller_id']);
//        response.send(404);
//    });
}

exports.call = call;