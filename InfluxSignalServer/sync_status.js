/**
 * Created by fengyun on 2014/10/16.
 * 除signal请求外的另外一个长连接，主要作向各客户端推送在线列表状态
 */
var dispatcher  = require('./dispatcher.js');
var tokenManage = require('./token_manage.js');
var logger = require('./log.js').logger;

function sync_status(request,response) {
    logger.info("Request handler 'sync_status' was called.");
//broadcast
    response.send(200);
}

exports.sync_status = sync_status;