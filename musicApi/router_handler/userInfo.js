const db = require('../db/index');

/*
  查询用户信息(uid)
    *400：未找到此账号
    *200：成功
*/
exports.getUserInfo=(req,res)=>{
    const token = req.headers.authorization;
    if(!token||!req.user||req.user=={}){return res.status(403).send({status: 403,msg: '身份认证失败'});}
    db.query('SELECT * FROM `users` WHERE `id`=?',[req.user.id],(err,results)=>{
        if(err){return res.cc(err.sqlMessage,err.errno)}
        if(results.length<=0){return res.cc('未找到此账号',400);}
        const {id,username,mail,img,sex,sign,plays,time} = results[0];
        db.query('SELECT * FROM `music` WHERE `uid`=?',[req.user.id],(err,result)=>{
            if(err){return res.cc(err.sqlMessage,err.errno)}
            return res.send({status: 200,msg: '获取成功~',data: {id,username,mail,img,sex,sign,plays,collects: result.length||0,time}});
        });
    });
}