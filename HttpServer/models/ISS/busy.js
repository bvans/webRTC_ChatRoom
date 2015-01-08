/**
 * Created by fengyun on 2014/10/27.
 */
var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('../../lib/log.js').logger;

function busy(request,response) {
    var callerId = tokenManage.validateToken(request.body['token'],'');
    if(!callerId){
        response.send(JSON.stringify({"error":
        {
            code: global.ERROR_TOKEN,
            reason: 'token failure'
        }}));
        return;
    }

    var callee = dispatcher.userMap.get(request.body['callee_id']);
    var caller = dispatcher.userMap.get(request.body['caller_id']);
    if (callee!== undefined && caller!== undefined) {
        dispatcher.userMap.get(request.body['callee_id']).status = dispatcher.status['Busy'];
        dispatcher.userMap.get(request.body['caller_id']).status = dispatcher.status['Busy'];
        response.send(200);
        return;
    }else{
        dispatcher.userMap.get(caller.id).status = dispatcher.status['Idle'];
        response.send({"error":
        {
            code: global.ERROR_NET,
            reason: 'callee cash by net'
        }});
        return;
    }
    response.send(200);
}

exports.busy = busy;