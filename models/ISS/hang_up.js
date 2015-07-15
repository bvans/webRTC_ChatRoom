/**
 * Created by fengyun on 2014/10/15.
 */
var url         = require("url");
var querystring = require("querystring");
var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('../../lib/log.js').logger,
    global = require('../common/errorCode.js').global;

function hang_up(request,response) {
    //firstly, must be judge who hang up
    var hang_uperId = tokenManage.validateToken(request.body['token'],'');
    if(!hang_uperId){
        response.send(JSON.stringify({"error":
        {
            code: global.ERROR_TOKEN,
            reason: 'token failure'
        }}));
        return;
    }

    var acceptId = '';
    if(hang_uperId === request.body['caller_id']){
        acceptId = request.body['callee_id'];
    }else if(hang_uperId === request.body['callee_id']){
        acceptId = request.body['caller_id'];
    }

    var accepter = dispatcher.userMap.get(acceptId);

    if(accepter === undefined){
        dispatcher.userMap.get(hang_uperId).status = dispatcher.status['Idle'];
        response.send({"error":
        {
            code: global.ERROR_NET,
            reason: 'callee cash by net'
        }});
        return;
    }
    var offer = {
        'caller_id' : request.body['caller_id'],
        'callee_id' : request.body['callee_id'],
        'signal'    : 'hang_up',
        'content'   : null
    };

    //dispatcher.wss.unicast(acceptId, JSON.stringify(offer));
    dispatcher.userMap.get(hang_uperId).status = dispatcher.status['Idle'];
    if(dispatcher.userMap.get(acceptId).status === dispatcher.status['Ready']){
    	dispatcher.userMap.get(acceptId).status = dispatcher.status['Idle'];
    }
    
    response.send(200);
}

exports.hang_up = hang_up;