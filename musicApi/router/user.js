//用户路由模块
const express = require('express');
const userHandler = require('../router_handler/user');
const router = express.Router();
const expressJOI = require('@escook/express-joi');
const {reg_login_schema,reg_register_schema} = require('../schema/user');

//注册用户 (邮箱[username] --- 密码[password])
router.post('/register',expressJOI(reg_register_schema),userHandler.register);
//登录 (用户名/邮箱[username] --- 密码[password])
router.post('/login',expressJOI(reg_login_schema),userHandler.login);

module.exports=router;