/* GET home page. */

//var cluster = require('cluster');
var Logon = require('../models/Infrastructure/logon.js'),
    FetchChannels = require('../models/Infrastructure/fetchChannels.js'),
    FetchContent = require('../models/Infrastructure/fetchContent.js'),
    Logoff = require('../models/Infrastructure/logoff.js'),
    CaptureScreenshot = require('../models/Infrastructure/captureScreenshot.js');

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.logon = function(req, res){
    var macId = req.query.id;
    var _version = req.query.version;
    if(_version == undefined || macId == undefined){
        res.send(404);
    }else{
        var logOn = new Logon();
        logOn.HandleRequest(macId,_version,res);
    }
};

exports.fetchChannels = function(req, res){
    var epgId = req.query.templateId;
    if(epgId == undefined){
        res.send(404);
    }else{
        var fetchChannels = new FetchChannels();
        fetchChannels.HandleRequest(epgId,res);
    }

};

exports.fetchContent = function(req, res){
    var epgId = req.query.templateId;
    var dirId = req.query.directoryId;
    var pgId  = req.query.pageId;
    if(epgId == undefined || dirId == undefined || pgId == undefined){
        res.send(404);
    }else{
        var fetchContent = new FetchContent();
        fetchContent.HandleRequest(epgId,dirId,pgId,res);
    }
};

exports.logoff = function(req, res){
    var macId = req.query.id;

    var logoff = new Logoff();
    logoff.HandleRequest(macId);

    res.send(200);
};

exports.captureScreenshot = function(req, res){

    var captureScreenshot = new CaptureScreenshot();
    captureScreenshot.HandleRequest(req,res);
};