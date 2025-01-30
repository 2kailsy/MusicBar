//导入express模块
const express = require('express');
//导入cors模块
const cors = require('cors');
//导入路由
const userRouter = require('./router/user');
const userInfoRouter = require('./router/userInfo');
const musicRouter = require('./router/music');
const untilsRouter = require('./router/utils');
//token相关
const Joi = require('joi');
const expressJWT = require('express-jwt');
const config = require('./config');
//创建express实例
const app = express();

app.use(cors());
app.use(express.urlencoded({extended:false}));
app.use((req,res,next)=>{
    //响应
    res.cc=(msg,status=1)=>{
        res.send({
            status,
            msg: msg instanceof Error ? msg.message : msg
        });
    }
    next();
});
app.use(expressJWT({secret: config.jwtSecretKey}).unless({path: [/^(\/api|\/tools)/]}));
app.use("/api",userRouter);
app.use("/tools",untilsRouter);
app.use("/user",userInfoRouter);
app.use("/music",musicRouter);

app.use((err,req,res,next)=>{
    if(err instanceof Joi.ValidationError){return res.cc(err);}
    if(err.name === 'UnauthorizedError'){return res.cc("身份认证失败");}
    res.cc(err);
});

//启动web服务器
app.listen(3000,()=>{
    console.log('The server is running at http://127.0.0.1:3000');
})