//用户路由模块
const express = require('express');
const userHandler = require('../router_handler/music');
const router = express.Router();
const expressJOI = require('@escook/express-joi');
const {
    reg_search_schema,
    reg_play_schema,
    reg_isInList_schema,
    reg_collectMusic_schema,
    reg_deleteCollect_schema,
    reg_getList_schema,
    reg_switchMusic_schema,
    reg_createList_schema
} = require('../schema/music');

//音乐搜索 (音乐名[musicName])
router.get('/searchMusic',expressJOI(reg_search_schema),userHandler.searchMusic);
//播放音乐 (音乐id[rid])
router.get('/getMusicUrl',expressJOI(reg_play_schema),userHandler.getMusicUrl);
//音乐收藏列表
router.get('/getList',expressJOI(reg_getList_schema),userHandler.selectCollections);
//音乐是否被收藏 (音乐id[rid])
router.get('/isInList',expressJOI(reg_isInList_schema),userHandler.isCollect);
//收藏音乐 (音乐名[name],作者[author],音乐id[rid],图片[pic])
router.post('/collect',expressJOI(reg_collectMusic_schema),userHandler.collectMusic);
//删除收藏 (音乐id[rid])
router.post('/deleteCollect',expressJOI(reg_deleteCollect_schema),userHandler.deleteCollect);
//增加听音乐的次数
router.get('/addPlays',userHandler.addPlays);
//获取所有歌单
router.get('/getLists',userHandler.selectLists);
//切歌 (下一曲？[next] --- 音乐id[rid] --- 歌单id[lid])
router.get('/switch',expressJOI(reg_switchMusic_schema),userHandler.switchMusic);
//新建歌单 (歌单名[name])
router.get('/createList',expressJOI(reg_createList_schema),userHandler.createList);

module.exports=router;