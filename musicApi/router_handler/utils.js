const mail = require('../utils/mail');

exports.sendMail=(req,res)=>{
    let code = parseInt(req.query.code);
    let type = parseInt(req.query.type);
    if(type>=50){code+=type}else{code-=type}
    mail(code,req.query.to);
    res.cc('发送成功~',200);
}