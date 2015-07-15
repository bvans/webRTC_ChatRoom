/**
 * Created by fengyun on 2014/10/14.
 */
var jwt = require('jwt-simple'),
    moment = require('moment'),
    dispatcher  = require('./dispatcher.js');
var expires = moment().startOf('hour').fromNow();

exports.generatorToken = function (id) {

    var token = jwt.encode({
        iss: id,
        exp: expires
    }, 'IIS');

    return token;
}

exports.validateToken = function(token,id){
    if(token === null || token === '' || token === undefined){
        return false;
    }

    var decoded;
    try{
        decoded = jwt.decode(token, 'IIS');
    }catch(e) {
      return false;
    }
    if (decoded.exp <= Date.now()) {
        return false;
    }

    if(id === ''){//to hang_up's token
        for(x in dispatcher.userMap.keySet() ){
            var element = dispatcher.userMap.get(dispatcher.userMap.keySet()[x]);
            if(token === element.token){
                return element['id'];
            }
        }
    }else{
        var ele = dispatcher.userMap.get(id);
		if (ele === undefined) {
		  return false;
		} 
        else if(token === ele.token){
            return true;
        }else{
            return false;
        }
    }

//todo compare it with mongodb

    return false;

}

