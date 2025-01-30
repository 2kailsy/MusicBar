//用户路由模块
const express = require('express');
const userHandler = require('../router_handler/userInfo');
const router = express.Router();

//查询用户信息
router.get('/getUserInfo',userHandler.getUserInfo);

module.exports=router;