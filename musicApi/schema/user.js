//定义验证规则
const joi = require('joi');
//定义规则对象
exports.reg_login_schema = {
    body: {
        username: joi.string().min(2).max(25).required(),
        password: joi.string().pattern(/^[\S]{6,20}$/).required()
    }
}
exports.reg_register_schema = {
    body: {
        mail: joi.string().pattern(/^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/).required(),
        password: joi.string().pattern(/^[\S]{6,20}$/).required()
    }
}