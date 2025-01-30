//定义验证规则
const joi = require('joi');
//定义规则对象
exports.reg_sendMail_schema = {
    query: {
        to: joi.string().pattern(/^[\S]{6,20}$/).required(),
        code: joi.required(),
        type: joi.required()
    }
}