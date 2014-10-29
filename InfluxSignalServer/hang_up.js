/**
 * Created by fengyun on 2014/10/15.
 */
var url         = require("url");
var querystring = require("querystring");
var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('./log.js').logger;

function hang_up(request,response) {
    logger.info("Request handler 'hang_up' was called.");

    //firstly, must be judge who hang up
    var hang_uperId = tokenManage.validateToken(request.body['token'],'');
    if(!hang_uperId){
        response.send(404);
    }

    var acceptId = '';
    if(hang_uperId === request.body['caller_id']){
        acceptId = request.body['callee_id'];
    }else if(hang_uperId === request.body['callee_id']){
        acceptId = request.body['caller_id'];
    }

    var acceptRes = null;
    acceptRes = dispatcher.userMap.get(acceptId).res;
    if(acceptRes === null){
        dispatcher.userMap.get(hang_uperId).status = dispatcher.status['Idle'];
        response.send(404);
        return;
    }
    acceptRes.send(200);//tell accept close peer connection

    //listen a event for answer
    var eventName = 'hang_up_ack' + '_' + request.body[hang_uperId];
    dispatcher.emitter.once(eventName, function (arg){
        dispatcher.userMap.get(hang_uperId).status = dispatcher.status['Idle'];
        response.send(200);//tell hang_up update ui
    });

    response.on('timeout', function(data) {
        dispatcher.userMap.get(hang_uperId).status = dispatcher.status['Idle'];
        response.send(404);//in case accept throwing an exception, and quit
    });

    //if hang_up shut down
//    response.on('close', function(data) {
//        dispatcher.userMap.remove(hang_uperId);
//        response.send(404);
//    });
}


exports.hang_up = hang_up;