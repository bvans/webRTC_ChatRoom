/**
 * Created by fengyun on 14-7-8.
 */
var events = require('events'),
    dbOperate = require('./dbOperate.js');

module.exports = netCmd_logOff;
function netCmd_logOff(){
    var db   = new dbOperate();
    this.HandleRequest = function(offlineID){
        db.logOff(offlineID);
    };
}
