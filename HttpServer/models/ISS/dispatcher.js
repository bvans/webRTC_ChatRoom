/**
 * Created by fengyun on 2014/10/13.
 * 调度者，负责维护在线用户列表、状态和检查keep-alive
 */

var events     = require('events'),
    STL        = require('../../lib/stl.js');

function dispatcher() {
}

dispatcher.userMap = new STL.SimpleMap();
dispatcher.status = {
    'Idle':'0',
    'Ready':'1',
    'Busy':'2'
};

dispatcher.EVENT_TYPE = {
    'SPEAK':'SPEAK',
    'REFUSED':'REFUSED',
    'HANGUP' :'HANGUP'
};

dispatcher.emitter  = new events.EventEmitter();

dispatcher.openTimer = function(){

    setInterval(function(){
        var tokenTime = 20 * 1000;//20s
        var list = dispatcher.userMap.keySet();
        for(var x = 0; x < list.length; ){
            var currentDate = new Date();
            var time =currentDate.getTime();
            var ele = dispatcher.userMap.get(list[x]);
            if(ele === undefined){
                ++x;
                continue;
            }
            var difference = time - ele.time;
            if(difference > tokenTime){//user should quit?!
                var e = dispatcher.userMap.remove(list[x]);
            }
            ++x;
        }
    },3000);//3s timer
};

module.exports = dispatcher;
