/**
 * Created by fengyun on 2014/10/15.
 */
var dispatcher  = require('./dispatcher.js');
var logger = require('./log.js').logger;

function log_out(request,response) {
    logger.info("Request handler 'logout' was called.");
    var clientId = request.body['id'];
    var userRes = null;
    userRes = dispatcher.userMap.get(clientId).res;
    userRes.send(200);
    dispatcher.userMap.remove(clientId);

    response.send(200);
}

exports.log_out = log_out;