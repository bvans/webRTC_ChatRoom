/**
 * Created by fengyun on 2014/10/15.
 */
var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('./log.js').logger;

function end_up(request,response) {
    logger.info("Request handler 'end_up' was called.");

    var end_uperId = tokenManage.validateToken(request.body['token'],'');
    if(!end_uperId){
        response.send(404);
    }

    var hang_uperId = '';
    if(end_uperId === request.body['caller_id']){
        hang_uperId = request.body['callee_id'];
    }else if(end_uperId === request.body['callee_id']){
        hang_uperId = request.body['caller_id'];
    }

    var eventName = 'hang_up_ack' + '_' + request.body[hang_uperId];
    dispatcher.emitter.emit(eventName,dispatcher.EVENT_TYPE.HANGUP);
    dispatcher.userMap.get(end_uperId).status = dispatcher.status['Idle'];
    response.send(200);

}

exports.end_up = end_up;