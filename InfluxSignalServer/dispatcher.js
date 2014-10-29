/**
 * Created by fengyun on 2014/10/13.
 * 调度者，负责维护在线用户列表、状态和服务器内部response间的通信
 */

var events     = require('events'),
    STL        = require('./stl.js');

function dispatcher() {
}

dispatcher.userList = [];
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

module.exports = dispatcher;
