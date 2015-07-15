/**
 * Created by fengyun on 14-7-8.
 */
var events = require('events');
var dbOperate = require('./dbOperate.js'),
    global = require('../common/errorCode.js').global;

module.exports = netCmd_logon;

function netCmd_logon(){

    var emitter = new events.EventEmitter();
    var db      = new dbOperate();

    this.HandleRequest = function(macAddress,version,res){
        db.isRegistered(macAddress,emitter);
        emitter.once('isRegistered',function(arg) {
            if (arg === '' && arg != global.ERROR_CRASHMYSQL && arg!= global.ERROR_QUERYMYSQL && arg!= undefined ){
                //如果没有找到相应设备，默认mac地址为：00-00-00-00-00-00
                arg = '15'//15为默认的mac id值
                macAddress = '00-00-00-00-00-00';
            }

            if (arg != '' && arg != global.ERROR_CRASHMYSQL && arg!= global.ERROR_QUERYMYSQL && arg!= undefined ) {

                db.logon(macAddress,version, emitter);
                emitter.once('get_moblieInfo', function (arg1) {

                    var epgId = '';
                    //arg1接收的是一个数组，包含4个元素，即epgid、Img、uid、apk、name
                    epgId = arg1[0];

                    if(epgId != '' && epgId != global.ERROR_CRASHMYSQL && epgId!= global.ERROR_QUERYMYSQL ){

                        var uid = '';
                        var apkLink = '';
                        var startImg = '';
                        var address = '';

                        //apk
                        if(arg1[3] == global.ERROR_CRASHMYSQL || arg1[3]== global.ERROR_QUERYMYSQL){
                            res.send(arg1[3]);
                            return;
                        }//arg1[3] == undefined ||
                        else{
                            if(arg1[3] == undefined)
                                apkLink = '';
                            else
                                apkLink = arg1[3];
                        }

                        //uid
                        if(arg1[1] == global.ERROR_CRASHMYSQL || arg1[1] == global.ERROR_QUERYMYSQL){
                            res.send(arg1[1]);
                            return;
                        }
                        else if(arg1[1] == undefined)
                            uid = '';
                        else
                            uid = arg1[1];

                        //Img
                        if(arg1[2] == global.ERROR_CRASHMYSQL || arg1[2] == global.ERROR_QUERYMYSQL){
                            res.send(arg1[2]);
                            return;
                        }
                        else if(arg1[2] == undefined)
                            startImg = '';
                        else
                            startImg = arg1[2];

                        //address
                        if(arg1[4] == global.ERROR_CRASHMYSQL || arg1[4] == global.ERROR_QUERYMYSQL){
                            res.send(arg1[4]);
                            return;
                        }
                        else if(arg1[4] == undefined)
                            address = '';
                        else
                            address = arg1[4];

                        //send success message
                        var logonContent = {
                            "UI id"         :uid,
                            "template id"   :epgId,
                            "startup image" :startImg,
                            "apklink"       : apkLink,
                            "device name"   : address
                        };

                        var jsonStr = JSON.stringify(logonContent);
                        jsonStr += '\n';

                        res.send(jsonStr);

                    }else{
                        if (epgId === ''){//can not find epg
                            var errEpg = global.ERROR_NOEPG;
                            res.send(errEpg);
                        }else{
                            res.send(arg);
                        }
                    }
                    //clientMac2Socket.addClient(parametersObj.id,socket);
                });
            } else {
                if (arg === ''){//can not find device
                    var errDevice = global.ERROR_NOREGISTER;
                    res.send(errDevice);
                    }else{
                    res.send(arg);
                }
            }
        });
    }
}
