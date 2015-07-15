/**
 * Created by fengyun on 2014/10/15.
 */

var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('../../lib/log.js').logger,
    global = require('../common/errorCode.js').global;

function call(request,response) {

    if(!tokenManage.validateToken(request.body['token'],request.body['caller_id'])){
        response.send(JSON.stringify({"error":
        {
            code: global.ERROR_TOKEN,
            reason: 'token failure'
        }}));
        return;
    }

    var calleeRes = null;

    //caller status changed -> ready
    dispatcher.userMap.get(request.body['caller_id']).status = dispatcher.status['Ready'];

    //find callee, and status changed -> ready
    var callee = dispatcher.userMap.get(request.body['callee_id']);
    if(callee === undefined){
	    dispatcher.userMap.get(request.body['caller_id']).status = dispatcher.status['Idle'];
        response.send({"error"://in case callee throwing an exception, and quit
        {
            code: global.ERROR_NET,
            reason: 'callee cash by net'
        }});
        return;
    }
    else if(callee.status !== dispatcher.status['Idle']){
        response.send({"error":
        {
            code: global.ERROR_BUSY,
            reason: 'callee is busy now'//tell caller, callee is busy now（通话中）
        }});
        return;
    }
    else {
        dispatcher.userMap.get(request.body['callee_id']).status = dispatcher.status['Ready'];
        var offer = {
            'caller_id' : request.body['caller_id'],
            'callee_id' : request.body['callee_id'],
            'signal'    : 'offer',
            'content'   : request.body['sdp']
        };
        dispatcher.wss.unicast(request.body['callee_id'], JSON.stringify(offer));
        response.send(200);
    }
}

exports.call = call;