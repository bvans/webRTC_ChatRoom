/**
 * Created by fengyun on 2014/7/14.
 */
var events       = require('events'),
             fs  = require('fs'),
            dbOperate = require('./dbOperate.js'),
            logger = require('../../lib/log.js').logger,
            global = require('../common/errorCode.js').global;

module.exports = captureScreenshot;
function  captureScreenshot(){

    var db      = new dbOperate();

    this.HandleRequest = function(req,res){

        var obj = req.files.thumbnail;
        if(obj != undefined || obj != null){
            var tmp_path = obj.path;
            var new_path = "public/"+obj.name;//路径根据实际情况修改
            var file_name = obj.name;

            var readStream = fs.createReadStream(tmp_path)
            var writeStream = fs.createWriteStream(new_path);
            writeStream.on('error',function(data){
                logger.error('des path :' + new_path + ' not exist! the reason that ' + data);
                res.send(global.ERROR_FAILSCREENSHOT);
            });

            readStream.pipe(writeStream);
            readStream.on('end', function() {
                fs.unlinkSync(tmp_path);
                var macRecvShotID = file_name.substr(0,file_name.indexOf('_'));

                db.updateScreenshot(file_name, macRecvShotID);
                res.send(200);

            });
        }else{
            res.send(global.ERROR_FAILSCREENSHOT);
        }
    }
};