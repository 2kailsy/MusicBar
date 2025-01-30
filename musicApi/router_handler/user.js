const db = require('../db/index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

/*
  *400：该帐号已注册
  *-200：注册失败
  *200：注册成功
*/
exports.register = (req,res)=>{
    const userInfo = req.body;
    db.query("SELECT * FROM `users` WHERE `mail`=?",[userInfo.mail],(err,results)=>{
        if(err){return res.cc(err.sqlMessage,err.errno);}
        if(results.length>0){return res.cc('该帐号已注册！',400);}
        userInfo.password=bcrypt.hashSync(userInfo.password,10);
        db.query("INSERT INTO `users` SET ?",{mail: userInfo.mail,password: userInfo.password,time: new Date()},(err,results)=>{
            if(err){return res.cc('注册失败',err.errno);}
            if(results.affectedRows!==1){return res.cc('注册失败',-200);}
            db.query("INSERT INTO `list` SET ?",{listName: '我的收藏',uid: results.insertId},(err,results)=>{
                if(err){return res.cc('注册失败',err.errno);}
                if(results.affectedRows!==1){return res.cc('注册失败',-200);}
                res.cc('注册成功~',200);
            });
        });
    });
};

/*
  *400：该帐号暂未注册
  *300：密码错误
  *200：登录成功
*/
exports.login = (req,res)=>{
    const userInfo = req.body;
    db.query('SELECT * FROM `users` WHERE `username`=? OR `mail`=?',[userInfo.username||'',userInfo.username||''],(err,results)=>{
        if(err){return res.cc(err.sqlMessage,err.errno)}
        if(results.length<=0){return res.cc('该帐号暂未注册',400);}
        if(!(bcrypt.compareSync(userInfo.password,results[0]['password']))){return res.cc('账号或密码错误~',300);}
        const token = jwt.sign({...results[0],password: ''},config.jwtSecretKey,{expiresIn: config.expiresIn})
        res.send({
            status: 200,
            msg: '登录成功~',
            data: {
                ...results[0],
                password: '',
                token: 'Bearer '+token
            }
        });
    });
};
