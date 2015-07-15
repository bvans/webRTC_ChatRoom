/**
 * Created by fengyun on 14-6-18.
 */
var db = require("./dbService.js"),
    async = require('async'),
    libHelper = require('../../lib/time.js'),
    logger = require('../../lib/log.js').logger;

var DEVICE_INFORMATION_TABLE = "device_information",
    EPG_AREA_MANAGE_TABLE ="epg_area_manage",
    EPG_TEMPLATE_TABLE = "epg_templet",
    VERSION_INFORMATION = "versioninfo";

var result = null;

module.exports = dbOperate;

function dbOperate(){
    var _this=this;

    var templateId = '';

    this.setTemplateId = function(tId){
        templateId = tId;
    };

    var dbService =  db;

    this.isRegistered = function (macAddress,emitter){
        async.auto({

                get_data: function(callback){
                    var condition = ' where mac =\'' + macAddress + '\'';
                    dbService.selectValue('id',DEVICE_INFORMATION_TABLE,condition,callback);
                }

            },function(err, results) {
                var data = results.get_data;
                emitter.emit('isRegistered',data);
            }
        );
    };

    this.logon = function(macAddress,version,emitter){

        var condition = ' where mac =\'' + macAddress + '\'';
        dbService.updateValue(DEVICE_INFORMATION_TABLE,'online = 1',condition);

        var currentDate = libHelper.getCurrentTime(1);
        var updateData = 'recent_online =\'' + currentDate + '\'';
        dbService.updateValue(DEVICE_INFORMATION_TABLE,updateData,condition);

        async.auto({
            get_areaId: function(callback){

                var condition = ' where mac =\'' + macAddress + '\'';
                dbService.selectValue('area_id',DEVICE_INFORMATION_TABLE,condition,callback);
            },

            get_deviceName: function(callback){

                var condition = ' where mac =\'' + macAddress + '\'';
                dbService.selectValue('address',DEVICE_INFORMATION_TABLE,condition,callback);
            },

            get_templateId : ['get_areaId',function(callback ,results) {
                var areaId = results.get_areaId;
                var condition = ' where area_id =\'' + areaId + '\'';
                dbService.selectValue('epg_templet_id',EPG_AREA_MANAGE_TABLE,condition,callback);
            }],

            get_uiId :['get_templateId',function(callback,results){
                templateId = results.get_templateId;
                var condition = ' where id =\'' + templateId + '\'';
                dbService.selectValue('ui_id',EPG_TEMPLATE_TABLE,condition,callback);
            }],

            get_updateStartupImage: function(callback){
                //dbService.selectValue('recent_online',DEVICE_INFORMATION_TABLE,'',callback);
                callback(null,true);
            },

            get_startupImage: ['get_updateStartupImage','get_templateId',function(callback ,results) {
                templateId = results.get_templateId;
                var isImgUpdate = results.get_updateStartupImage;

                if(!isImgUpdate){//do not update img
                     callback(null, '');
                }else{
                    var condition = ' where id =\'' + templateId + '\'';
                    dbService.selectValue('startup_image',EPG_TEMPLATE_TABLE,condition,callback);
                }
            }],

            get_updateVersion: function(callback){
                dbService.selectValue('version',VERSION_INFORMATION,'',callback);
            },

            get_apkLink: ['get_updateVersion',function(callback ,results) {
                var versionFromDB = results.get_updateVersion;
                logger.info(versionFromDB +  ' from DB ');
                logger.info(version +  ' from Client ');
                if(versionFromDB.split('.').length == 3 && version.split('.').length == 3){
                    var firstBitFromDb = parseInt(versionFromDB.split('.')[0]);
                    var firstBitFromClient = parseInt(version.split('.')[0]);

                    if(firstBitFromClient < firstBitFromDb){
                        dbService.selectValue('apklink',VERSION_INFORMATION,'',callback);
                    }else if(firstBitFromClient == firstBitFromDb){
                        var secBitFromDb = parseInt(versionFromDB.split('.')[1]);
                        var secBitFromClient = parseInt(version.split('.')[1]);

                        if(secBitFromClient < secBitFromDb){
                            dbService.selectValue('apklink',VERSION_INFORMATION,'',callback);
                        }else if(secBitFromClient == secBitFromDb){
                            var thiBitFromDb = parseInt(versionFromDB.split('.')[2]);
                            var thiBitFromClient = parseInt(version.split('.')[2]);

                            if(thiBitFromClient < thiBitFromDb){
                                dbService.selectValue('apklink',VERSION_INFORMATION,'',callback);
                            }else if(thiBitFromClient == thiBitFromDb){
                                callback(null, '');
                            }else{
                                callback(null, '');
                                logger.error('version error from client');
                            }
                        }else{
                            callback(null, '');
                            logger.error('version error from client');
                        }
                    }else{
                        callback(null, '');
                        logger.error('version error from client');
                    }
                }else{
                    callback(null, '');
                    logger.error('version format error: from db ' + versionFromDB.split('.').length + ',from client ' + version.split('.').length);
                }
            }]

        },function(err, results) {
            templateId      = results.get_templateId;
            var uiId     = results.get_uiId;
            var apkLink     = results.get_apkLink;
            var startImg    = results.get_startupImage;
            var address     = results.get_deviceName;

            var deviceInfo = new Array(templateId,uiId,startImg,apkLink,address);
            emitter.emit('get_moblieInfo',deviceInfo);
        });
    };

    this.logOff = function(macAddress){
        var condition = ' where mac =\'' + macAddress + '\'';
        //Update online ,recent_online
        dbService.updateValue(DEVICE_INFORMATION_TABLE,'online = 0',condition);

        var currTime = libHelper.getCurrentTime(1);
        var updateData = 'recent_offline = \'' + currTime + '\'';
        dbService.updateValue(DEVICE_INFORMATION_TABLE,updateData,condition);
    };

    this.isUpdateChannels = function(emitter){
        //console.log('update channels succeed');
        return true;
    };

    this.updateScreenshot = function(fileName,macId){
        var condition = ' where mac =\'' + macId + '\'';
        var updateData = 'screenshot = \'' + fileName+ '\'';
        dbService.updateValue(DEVICE_INFORMATION_TABLE,updateData,condition);
    };

    this.getChannelList = function(emitter){

        async.auto({
            get_channel: function (callback) {

                var channelTable = "epg_channel_";
                channelTable += templateId;

                var condition = '  WHERE parentID = 0 ORDER BY queue';
                dbService.selectMulitValue('id,title,queue,description,resource',channelTable,condition,callback);

            }
        },
        function(err, results) {
            var recArray = results.get_channel;
            var content = [];
            for(x in recArray) {
               var resultSet = {};
               resultSet = {"index":recArray[x].id,"title":recArray[x].title,"queue":recArray[x].queue,
                       "description":recArray[x].description,"resource":recArray[x].resource};
               content.push(resultSet);
            }

            emitter.emit('getChannel_finished',content);
        });
    };

    this.isHaveDirectoryIndex = function(dirID,recentlyReq,emitter){

        var result, channelTableName;

        channelTableName = "epg_channel_";
        channelTableName += templateId;

        async.auto({

           judge_dir: function(callback){
                    var condition = ' where id =\'' + dirID + '\'';
                    dbService.selectValue('title',channelTableName,condition,callback);
                }

            },function(err, results) {
                var isDir = results.judge_dir;
                emitter.emit('isDirExist', isDir);
            }
        );
    };

    this.getContentByParentId = function(dirID,pageId,emitter){

        pageId *= 20;
        var listNumbers = '20';
        async.auto({
            get_directory : function(callback){

                //var condition = ' where parentID =\'' + dirID + '\'';
                var condition = ' where parentID =\'' + dirID + '\' ORDER BY queue limit ' + pageId + ',' + listNumbers;
                var channelTableName = 'epg_channel_' + templateId;

                dbService.selectMulitValue('id,title,queue,description,resource',channelTableName,condition,callback);
            },

            get_epgContent : function(callback){

                var channelTableName = 'epg_channelcontent_' + templateId;
                var multiSql = 'SELECT id,title,description,resource,stream AS urls,editor,updatetime,queue,t1.source_type as type \
                from (SELECT source_id, source_type,queue from ' + channelTableName +  ' WHERE parentID = ' + dirID + '  ORDER BY queue  DESC LIMIT ' + pageId + ',' + listNumbers + ') t1\
                inner JOIN source_video  t2 on t1.source_type = "video" where t1.source_id = t2.id\
                UNION\
                SELECT id,title,description,resource,img_urls AS urls,editor,updatetime,queue,t1.source_type as type  \
                from (SELECT source_id, source_type,queue from ' + channelTableName +  ' WHERE parentID = ' + dirID + ' ORDER BY queue  DESC LIMIT ' + pageId + ',' + listNumbers + ') t1\
                inner JOIN source_img  t3 on t1.source_type = "img" where t1.source_id = t3.id\
                UNION\
                SELECT id,title,description,resource,document_urls AS urls,editor,updatetime,queue,t1.source_type as type  \
                from (SELECT source_id, source_type,queue from ' + channelTableName +  ' WHERE parentID = ' + dirID + '  ORDER BY queue DESC LIMIT ' + pageId + ',' + listNumbers + ') t1\
                inner JOIN source_document  t4 on t1.source_type = "document" where t1.source_id = t4.id\
                UNION\
                SELECT id,title,description,resource,webpage_urls AS urls,editor,updatetime,queue,t1.source_type as type  \
                from (SELECT source_id, source_type,queue from ' + channelTableName +  ' WHERE parentID = ' + dirID + '  ORDER BY queue DESC LIMIT ' + pageId + ',' + listNumbers + ') t1\
                inner JOIN source_web  t5 on t1.source_type = "web" where t1.source_id = t5.id\
                UNION\
                SELECT id,title,description,resource,stream_page AS urls,editor,updatetime,queue,t1.source_type as type  \
                from (SELECT source_id, source_type,queue from ' + channelTableName +  ' WHERE parentID = ' + dirID + '  ORDER BY queue DESC LIMIT ' + pageId + ',' + listNumbers + ') t1\
                inner JOIN carousel  t6 on t1.source_type = "carousel" where t1.source_id = t6.id \
                UNION\
                SELECT id,title,news_content AS description,news_picture AS resource,news_streamPath AS urls,editor,updatetime,queue,t1.source_type as type  \
                from (SELECT source_id, source_type,queue from ' + channelTableName +  ' WHERE parentID = ' + dirID + '  ORDER BY queue DESC LIMIT ' + pageId + ',' + listNumbers + ') t1\
                inner JOIN source_news  t7 on t1.source_type = "news_templet" where t1.source_id = t7.id ';

                 /*
                  SELECT id,title,description,resource,stream_page AS urls,editor,updatetime,queue,t1.source_type as type
                  from (SELECT source_id, source_type,queue from epg_channelcontent_7 WHERE parentID = 18  ORDER BY queue LIMIT 0,20 ) t1
                  inner JOIN source_video  t2 on t1.source_type = 'video' where t1.source_id = t2.id
                  UNION

                  SELECT id,title,description,resource,img_urls AS urls,editor,updatetime,queue,t1.source_type as type
                  from (SELECT source_id, source_type,queue from epg_channelcontent_7 WHERE parentID = 18  ORDER BY queue LIMIT 0,20 ) t1
                  inner JOIN source_img  t3 on t1.source_type = 'img' where t1.source_id = t3.id
                  UNION

                  SELECT id,title,description,resource,document_urls AS urls,editor,updatetime,queue,t1.source_type as type
                  from (SELECT source_id, source_type,queue from epg_channelcontent_7 WHERE parentID = 18  ORDER BY queue LIMIT 0,20 ) t1
                  inner JOIN source_document   t4 on t1.source_type = 'document' where t1.source_id = t4.id
                  UNION

                  SELECT id,title,description,resource,webpage_urls AS urls,editor,updatetime,queue,t1.source_type as type
                  from (SELECT source_id, source_type,queue from epg_channelcontent_7 WHERE parentID = 18  ORDER BY queue LIMIT 0,20 ) t1
                  inner JOIN source_web  t5 on t1.source_type = 'web' where t1.source_id = t5.id
                  UNION

                  SELECT id,title,description,resource,stream_page  AS urls,editor,updatetime,queue,t1.source_type as type
                  from (SELECT source_id, source_type,queue from epg_channelcontent_7 WHERE parentID = 18  ORDER BY queue LIMIT 0,20 ) t1
                  inner JOIN carousel  t6 on t1.source_type = 'carousel' where t1.source_id = t6.id
                  UNION

                  SELECT id,title,news_content AS description,news_picture AS resource,news_streamPath AS urls,editor,updatetime,queue,t1.source_type as type
                  from (SELECT source_id, source_type,queue from epg_channelcontent_7 WHERE parentID = 18  ORDER BY queue LIMIT 0,20 ) t1
                  inner JOIN source_news t7 on t1.source_type = 'news_templet' where t1.source_id = t7.id;
                 */

				dbService.selectMoreValue(multiSql,callback);
            }

        },function(err, results) {

            var dirArray = results["get_directory"];
            var directory = [];
            for(x in dirArray) {
                var resultSet = {};
                resultSet = {"type":"dir","index":dirArray[x].id,"title":dirArray[x].title,"queue":dirArray[x].queue,
                    "description":dirArray[x].description,"resource":dirArray[x].resource,"urls":''};
                directory.push(resultSet);
            }

            var fileArray = results["get_epgContent"];
            var fileContent = [];
            for(y in fileArray) {
                var resultSet = {};
                resultSet = {"type":fileArray[y].type,"index":fileArray[y].id,"title":fileArray[y].title,"queue":fileArray[y].queue,
                    "description":fileArray[y].description,"resource":fileArray[y].resource,"urls":fileArray[y].urls};
                fileContent.push(resultSet);
            }

            emitter.emit('channelContent',directory,fileContent);
        });


    }
}



