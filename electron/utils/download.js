//文件下载 所需要的基本类
var fs = require("fs");
var pt = require("path");
var request = require("request");

module.exports=async (url,name,path)=>{
    var res = {status: -200,msg: '下载失败!'};
    return new Promise(resolve=>{
        var dirPath = pt.join(__dirname,path);
        if(!fs.existsSync(dirPath)){fs.mkdirSync(dirPath)};
        if(fs.existsSync(pt.join(dirPath,name))){return resolve({status: 300,msg: '已经下载过了'});}
        let stream = fs.createWriteStream(pt.join(dirPath,name||`${Math.round(Math.random()*1000)}.mp3`));
        request(url).pipe(stream).on("close",async (err)=>{
            if(err){res.msg=err;resolve(res);return;}
            return resolve({status: 200,msg: '已下载'});
        });
    });
}