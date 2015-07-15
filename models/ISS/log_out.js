/**
 * Created by fengyun on 2014/10/15.
 */
var dispatcher  = require('./dispatcher.js');
var logger = require('../../lib/log.js').logger;

function log_out(request,response) {
    var clientId = request.body['id'];

    dispatcher.userMap.remove(clientId);
    response.send(200);

}

exports.log_out = log_out;