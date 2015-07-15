/**
 * Created by fengyun on 14-7-8.
 */
var events = require('events');
var dbOperate = require('./dbOperate.js'),
    global = require('../common/errorCode.js').global;

module.exports = netCmd_fetchChannels;

function netCmd_fetchChannels(){
    var emitter = new events.EventEmitter();

    var db      = new dbOperate();

    this.HandleRequest = function(templateId,res) {
        //important step
        db.setTemplateId(templateId);

        db.getChannelList(emitter);

        emitter.once('getChannel_finished',function(arg1){
            var content = arg1;
            if(content == global.ERROR_CRASHMYSQL || content == global.ERROR_QUERYMYSQL){
                res.send(content);
                return;
            }
            var jsObj = {
                "content":content
            };

            var jsonStr = JSON.stringify(jsObj);
            jsonStr += '\n';

            res.send(jsonStr);
        });
    };
}