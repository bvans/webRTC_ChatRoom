/**
 * Created by fengyun on 2014/10/15.
 */

var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('../../lib/log.js').logger,
    global = require('../common/errorCode.js').global;

function refused(request,response) {

    if(!tokenManage.validateToken(request.body['token'],request.body['callee_id'])){
        response.send(JSON.stringify({"error":
        {
            code: global.ERROR_TOKEN,
            reason: 'token failure'
        }}));
        return;
    }

    var refused = {
        'caller_id': request.body['caller_id'],
        'callee_id': request.body['callee_id'],
        'signal'   : "refused",
        'content'  : null
    };
    dispatcher.wss.unicast(request.body['caller_id'], JSON.stringify(refused));

    //callee' status have changed ->busy
    dispatcher.userMap.get(request.body['callee_id']).status = dispatcher.status['Idle'];
    dispatcher.userMap.get(request.body['caller_id']).status = dispatcher.status['Idle'];

    response.send(200);

}

exports.refused = refused;