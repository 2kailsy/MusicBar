//文件下载 所需要的基本类
var fs = require("fs");
var pt = require("path");
var request = require("request");

exports.download=(url,name,path)=>{
    var dirPath = pt.join(__dirname,path);
    if(!fs.existsSync(dirPath)){fs.mkdirSync(dirPath)};
    let stream = fs.createWriteStream(pt.join(dirPath,name||`${Math.round(Math.random()*1000)}.mp3`));
    request(url).pipe(stream).on("close", function (err) {
        if(err){return err;}
        return "ok";
    });
}