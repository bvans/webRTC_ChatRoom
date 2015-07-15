/**
 * Created by fengyun on 2014/10/15.
 */
var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('../../lib/log.js').logger,
    global = require('../common/errorCode.js').global;

function end_up(request,response) {

    var end_uperId = tokenManage.validateToken(request.body['token'],'');
    if(!end_uperId){
        response.send(JSON.stringify({"error":
        {
            code: global.ERROR_TOKEN,
            reason: 'token failure'
        }}));
        return;
    }

    dispatcher.userMap.get(end_uperId).status = dispatcher.status['Idle'];
    if(end_uperId === request.body['caller_id']){
        dispatcher.userMap.get(request.body['callee_id']).status = dispatcher.status['Idle'];
    }else if(end_uperId === request.body['callee_id']){
        dispatcher.userMap.get(request.body['caller_id']).status = dispatcher.status['Idle'];
    }
    response.send(200);

}

exports.end_up = end_up;