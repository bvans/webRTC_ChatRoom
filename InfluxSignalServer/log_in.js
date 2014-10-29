/**
 * Created by fengyun on 2014/10/13.
 */

var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('./log.js').logger;

function log_in(request,response) {
    logger.info("Request handler 'login' was called.");

    var clientId = request.body['id'];
    var clientName = request.body['name'];//bug:接收中文乱码

    var token = tokenManage.generatorToken(clientId);

    dispatcher.userMap.put(clientId,{
        'id':clientId,
        'name':clientName,
        'token':token,
        'status':dispatcher.status['Idle']
    });

    var userList = [];//del res, because json throw error
    for(x in dispatcher.userMap.keySet() ){
        var ele = dispatcher.userMap.get(dispatcher.userMap.keySet()[x]);
        userList.push({
            'id':ele.id,
            'name':ele.name,
            'token':ele.token,
            'status':ele.status
        });
    }

    var jsonStr = JSON.stringify({
        'token' : token,
        'users': userList
    });
    jsonStr += '\n';//client needs

    response.send(jsonStr);
}

exports.log_in = log_in;