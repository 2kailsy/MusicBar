//导入mysql模块
const mysql = require('mysql');
const config = require('../config');
//建立链接
const db = mysql.createPool(config.mysql);
//暴露db对象供其他使用
module.exports=db;