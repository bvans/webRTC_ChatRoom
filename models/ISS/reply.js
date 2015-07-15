/**
 * Created by fengyun on 2014/10/15.
 */

//Obviously the callee accept the offer

var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('../../lib/log.js').logger,
    global = require('../common/errorCode.js').global;

function reply(request,response) {

    if(!tokenManage.validateToken(request.body['token'],request.body['callee_id'])){
        response.send(JSON.stringify({"error":
        {
            code: global.ERROR_TOKEN,
            reason: 'token failure'
        }}));
        return;
    }

    var caller = dispatcher.userMap.get(request.body['caller_id']);
    if (caller === undefined) {
        response.send({"error":
        {
            code: global.ERROR_NET,
            reason: 'callee cash by net'        //Maybe the receiver is offline.
        }});

        //The caller has logged out.
        dispatcher.userMap.get(request.body['callee_id']).status = dispatcher.status['Idle'];

        return;
    }
    else if (caller.status === dispatcher.status['Ready']){
        var answer = {
            'caller_id' : request.body['caller_id'],
            'callee_id' : request.body['callee_id'],
            'signal'    : 'answer',
            'content'   : request.body['sdp']
        };
        dispatcher.wss.unicast(request.body['caller_id'], JSON.stringify(answer));
        response.send(200);
        return;
    }

    response.send(200);
}

exports.reply = reply;