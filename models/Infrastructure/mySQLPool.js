/**
 * Created by fengyun on 14-7-8.
 */

var mysql               = require('mysql');

var pool  = mysql.createPool({
    connectionLimit : 10000,
    host            : '127.0.0.1',
    user            : 'root',
    password        : '123123',
    database        :'teacher_platform_d1',
    port            : 3306
});

module.exports = pool;

