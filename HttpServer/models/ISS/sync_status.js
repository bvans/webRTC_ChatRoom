/**
 * Created by fengyun on 2014/10/16.
 * 除signal请求外的另外一个长连接，主要作向各客户端推送在线列表状态
 */
var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('../../lib/log.js').logger,
    global = require('../common/errorCode.js').global;

function sync_status(request,response) {
    if(!tokenManage.validateToken(request.body['token'],request.body['id'])){
        response.send(JSON.stringify({"error":
        {
            code: global.ERROR_TOKEN,
            reason: 'token failure'
        }}));
        return;
    }

    dispatcher.userMap.get(request.body['id']).time = new Date().getTime();
    var userList = [];//del res, because json throw error
    var list = dispatcher.userMap.keySet();
    for(var x = 0; x < list.length; ){
        var ele = dispatcher.userMap.get(list[x++]);
        if(ele === undefined){
            continue;
        }else{
            userList.push({
                'id':ele.id,
                'name':ele.name,
                'token':ele.token,
                'status':ele.status
            });
        }
    }

    var jsonStr = JSON.stringify({
        'users': userList
    });
    jsonStr += '\n';//client needs

    response.send(jsonStr);
}

exports.sync_status = sync_status;