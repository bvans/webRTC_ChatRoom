/**
 * Created by fengyun on 2014/10/14.
 */
var express = require('express');
var logger = require('../../lib/log.js').logger;

//create express server
var app = express();

//use middleware
app.use(express.json());
app.use(express.urlencoded());

//write logs info
log.use(app);

//process route
app.post('/v1/log_in', require("./log_in.js").log_in);
app.post('/v1/signal', require("./signal.js").signal);
app.post('/v1/call', require("./call.js").call);
app.post('/v1/reply', require("./reply.js").reply);
app.post('/v1/hang_up', require("./hang_up.js").hang_up);
app.post('/v1/end_up', require("./end_up.js").end_up);
app.post('/v1/log_out', require("./log_out.js").log_out);
app.post('/v1/sync_status', require("./sync_status.js").sync_status);

app.listen(7878);
console.log('Influx signal server has started...');