/**
 * Created by fengyun on 2014/10/15.
 */

//Obviously the callee accept the offer

var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('../../lib/log.js').logger,
    global = require('../common/errorCode.js').global;

function ice_candidate(request,response) {

    var senderId = tokenManage.validateToken(request.body['token'],'');
    if(!senderId){
        response.send(JSON.stringify({"error":
        {
            code: global.ERROR_TOKEN,
            reason: 'token failure'
        }}));
        return;
    }

    var receiverId = '';
    if(senderId === request.body['caller_id']){
        receiverId = request.body['callee_id'];
    }else if(senderId === request.body['callee_id']){
        receiverId = request.body['caller_id'];
    }

    var sender = dispatcher.userMap.get(senderId);
    var receiver = dispatcher.userMap.get(receiverId);
    if (receiver!== undefined && sender !== undefined) {
        var iceCandidate = {
            'caller_id': request.body['caller_id'],
            'callee_id': request.body['callee_id'],
            'signal'   : "ice_candidate",
            'content'  : request.body['ice_candidate']
        };
        dispatcher.wss.unicast(receiverId, JSON.stringify(iceCandidate));
        response.send(200);
        return;
    }
    else {
        dispatcher.userMap.get(senderId).status = dispatcher.status['Idle'];
        response.send({"error":
        {
            code: global.ERROR_NET,
            reason: 'callee cash by net'        //Maybe the receiver is offline.
        }});
        return;
    }
}

exports.ice_candidate = ice_candidate;