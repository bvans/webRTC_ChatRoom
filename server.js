var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes');
var log = require('./lib/log.js');
var http = require('http');
var WebSocketServer = require('ws').Server;
var app = express();
var IssPush = require('./models/ISS/IssPush.js');
var dispatcher = require('./models/ISS/dispatcher');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(require('connect-multiparty')());
app.use(express.urlencoded({uploadDir:'./uploads'}));
app.use(express.json({uploadDir:'./uploads'}));
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(cookieParser());
log.use(app);
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//process route
app.get('/', routes.index);
app.get('/logon', routes.logon);
app.get('/fetchChannels', routes.fetchChannels);
app.get('/fetchContent', routes.fetchContent);
app.get('/logoff', routes.logoff);
app.get('/v1/signal', require("./models/ISS/signal.js").signalEx);
app.use('/public', express.static(__dirname + '/public'));
app.use('/', express.static(__dirname + '/public'));

app.post('/v1/log_in', require("./models/ISS/log_in.js").log_in);
app.post('/v1/signal', require("./models/ISS/signal.js").signal);
app.post('/v1/call', require("./models/ISS/call.js").call);
app.post('/v1/busy', require("./models/ISS/busy.js").busy);
app.post('/v1/reply', require("./models/ISS/reply.js").reply);
app.post('/v1/refused', require("./models/ISS/refused.js").refused);
app.post('/v1/hang_up', require("./models/ISS/hang_up.js").hang_up);
app.post('/v1/end_up', require("./models/ISS/end_up.js").end_up);
app.post('/v1/log_out', require("./models/ISS/log_out.js").log_out);
app.post('/v1/sync_status', require("./models/ISS/sync_status.js").sync_status);
app.post('/screenshot', routes.captureScreenshot);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var port = 18080;

var httpServer = http.createServer(app).listen(port,function() {
    console.log('Express server have started, and listening on port ' + port);
});

var wss = new WebSocketServer({server: httpServer});
dispatcher.wss = IssPush.wsInit(wss, dispatcher.userMap);
dispatcher.openTimer();

module.exports = app;
