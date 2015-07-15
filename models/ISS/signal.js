/**
 * Created by fengyun on 2014/10/15.
 */

var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('../../lib/log.js').logger;

function signal(request,response) {
    logger.info("Request handler 'signal' was called.");

    if(!tokenManage.validateToken(request.body['token'],request.body['id'])){
        response.send(404);
        return;
    }

    var clientId = request.body['id'];

    //set res to user object
    dispatcher.userMap.get(clientId).res = response;

    response.setTimeout(86400000, function(){//default 2min,but here is change to 1day
        //Todo return Json object
        response.send('timeout,request again!');
    });

    //shut down
    response.on('close', function(data) {
        dispatcher.userMap.remove(request.body['id']);
        response.send(404);
    });
}

function signalEx(request,response) {
    logger.info("Request handler 'signal' was called.");

    var clientId = request.query.id;
    var token = request.query.token;

    if(!tokenManage.validateToken(token,clientId)){
        response.send(404);
        return;
    }

    //set res to user object
    dispatcher.userMap.get(clientId).res = response;

    response.setTimeout(86400000, function(){//default 2min,but here is change to 1day
        //Todo return Json object
        response.send('timeout,request again!');
    });

    //shut down
    response.on('close', function(data) {
        dispatcher.userMap.remove(clientId);
        response.send(404);
    });
}

exports.signal = signal;
exports.signalEx = signalEx;