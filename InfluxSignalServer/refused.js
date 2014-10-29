/**
 * Created by fengyun on 2014/10/15.
 */

var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('./log.js').logger;

function refused(request,response) {
    logger.info("Request handler 'refused' was called.");

    if(!tokenManage.validateToken(request.body['token'],request.body['callee_id'])){
        response.send(404);
    }

    //emit a event for answer
    var eventName = 'call_ack' + '_' + request.body['caller_id'];
    dispatcher.emit(eventName,dispatcher.EVENT_TYPE.REFUSED);

    //callee' status have changed ->busy
    dispatcher.userMap.get(request.body['callee_id']).status = dispatcher.status['Idle'];

    response.send(200);

}

exports.refused = refused;