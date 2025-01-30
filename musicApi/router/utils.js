//用户路由模块
const express = require('express');
const userHandler = require('../router_handler/utils');
const router = express.Router();
const expressJOI = require('@escook/express-joi');
const {reg_sendMail_schema} = require('../schema/utils');

//发送验证码 (接收方邮箱[to])
router.get('/sendCode',expressJOI(reg_sendMail_schema),userHandler.sendMail);

module.exports=router;