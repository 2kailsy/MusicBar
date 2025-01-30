//定义验证规则
const joi = require('joi');
//定义规则对象
exports.reg_search_schema = {
    query: {
        musicName: joi.string().required()
    }
}
exports.reg_play_schema = {
    query: {
        rid: joi.required()
    }
}
exports.reg_isInList_schema = {
    query: {
        rid: joi.required(),
        lid: joi.required()
    }
}
exports.reg_collectMusic_schema = {
    body: {
        name: joi.string().required(),
        author: joi.string().required(),
        rid: joi.required(),
        pic: joi.string().required(),
        lid: joi.required(),
    }
}
exports.reg_deleteCollect_schema = {
    body: {
        rid: joi.required(),
        lid: joi.required()
    }
}
exports.reg_getList_schema = {
    query: {
        lid: joi.required()
    }
}
exports.reg_switchMusic_schema = {
    query: {
        next: joi.boolean().required(),
        rid: joi.required(),
        lid: joi.required()
    }
}
exports.reg_createList_schema = {
    query: {
        name: joi.string().min(2).max(10).required()
    }
}