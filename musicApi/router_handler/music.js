const axios = require('axios');
const db = require('../db/index');
const {getMusicInfo}=require('../utils/creeper')
const getMusicLrc=async (rid)=>{
    let result = {status: -200};
    await axios.get('http://m.kuwo.cn/newh5/singles/songinfoandlrc', {
      params: {musicId: rid}
    }).then((res)=>{
      if(!(res.status==200)){return;}
      if(!(res.data.status==200)){return;}
      result=res.data.data.lrclist;
    }).catch((e)=>{result = {status: -200}});
    return result;
}
const selectCollections=(lid,uid)=>{
    return new Promise((reslove)=>{
      db.query('SELECT * FROM `music` WHERE `uid`=? AND `lid`=?',[uid,lid],(err,res)=>{
        if(err){return reslove({status: err.errno,msg: err.sqlMessage})}
        if(res.length<=0){return reslove({status: 200,msg: '您的收藏为空~'});}
        return reslove(res);
      });
    });
}
const isCollect=async (rid,lid,uid)=>{
    let res = await selectCollections(lid,uid);
    if(!(res.status==200)&&res.status){return {status: res.status,msg: '获取失败！'};}
    let isCollect = false;
    let id;
    for(let i in res){
        if(res[i]['rid']==rid){
            isCollect=true;
            id=res[i]['id'];
            break;
        }
    }
    return {in: isCollect,id: id};
}
const collectMusic=(name,author,rid,pic,lid,id)=>{
  return new Promise((reslove)=>{
    db.query('SELECT * FROM `music` WHERE `rid`=? AND `uid`=? AND `lid`=?',[rid,id,lid],(err,res)=>{
      if(err){return reslove({status: err.errno,msg: err.sqlMessage})}
      if(res.length>0){return reslove({status: -200,msg: '该歌曲已收藏！'});}
      db.query('INSERT INTO `music` SET ?',[{name:name,author:author,rid:rid,pic:pic,lid: lid,uid: id}],(err,res)=>{
        if(err){return reslove({status: err.errno,msg: err.sqlMessage})}
        if(res.affectedRows<=0){return reslove({status: -200,msg: '收藏失败！'});}
        reslove({status: 200,msg: '收藏成功'});
      });
    });
  });
}
const deleteMusic=(id,lid)=>{
    return new Promise((reslove)=>{
      db.query('DELETE FROM `music` WHERE `id` = ? AND `lid` = ?',[id,lid],(err,res)=>{
        if(err){return reslove({status: err.errno,msg: err.sqlMessage})}
        if(res.affectedRows<=0){return reslove({status: -200,msg: '删除失败'});}
        return reslove({status:200,msg: '删除成功'});
    });
});
}
const deleteCollections=async (rid,lid,uid)=>{
    let res = await isCollect(rid,lid,uid);
    if(!res.in){return {status:-200,msg: '该歌曲暂未收藏，请稍后再试~'}};
    return await deleteMusic(res.id,lid);
}
const increasePlays=(uid)=>{
    return new Promise((reslove)=>{
      db.query('SELECT * FROM `users` WHERE `id`=?',[uid],(err,res)=>{
        if(err){return reslove({status: err.errno,msg: err.sqlMessage})}
        if(res.length<=0){return reslove({status: 400,msg: '未找到此账号'});}
        const {plays} = res[0];
        if(typeof plays != 'number'){plays=Number(plays);}
        db.query('UPDATE `users` SET `plays` = ? WHERE `id` = ?',[plays+1,uid],(err,res)=>{
            if(err){return reslove({status: err.errno,msg: err.sqlMessage})}
            if(res.affectedRows<=0){return reslove({status: 400,msg: '修改失败'});}
          return reslove({status: 200,msg: '成功~'});
        });
      });
    });
}
const selectLists=(uid)=>{
    return new Promise((reslove)=>{
      db.query('SELECT * FROM `list` WHERE `uid`=?',[uid],(err,res)=>{
        if(err){return reslove({status: err.errno,msg: err.sqlMessage})}
        if(res.length<=0){return reslove({status: 200,msg: '您没有收藏~'});}
        let lists = [];
        for(let i in res){
            lists[i]={lid: res[i].id,name: res[i].listName}
        }
        return reslove({status: 200,list: lists});
      });
    });
}
const createList=(name,uid)=>{
    if(!name||!uid){return;}
    return new Promise((reslove)=>{
      db.query('SELECT * FROM `list` WHERE `uid`=? AND `listName`=?',[uid,name],(err,res)=>{
        if(err){return reslove({status: err.errno,msg: err.sqlMessage})}
        if(res.length>0){return reslove({status: -200,msg: '列表已存在'});}
        db.query('INSERT INTO `list` SET ?',[{listName: name,uid: uid}],(err,res)=>{
          if(err){return reslove({status: err.errno,msg: err.sqlMessage})}
          if(res.affectedRows<=0){return reslove({status: -200,msg: '创建失败'});}
          return reslove({status: 200,msg: '创建成功~',data: {lid: res.insertId,name: name,uid: uid}});
        });
      });
    });
}
exports.searchMusic=async (req,res)=>{
    let ress = {status: -200,msg: '获取失败'};
    await axios.get(`https://search.kuwo.cn/r.s`, {
        params: {
            all: req.query.musicName,
            vipver: '1',
            rn: '30',
            ft: 'music',
            encoding: 'utf8',
            rformat: 'json',
			mobi: '1'
        }
    }).then(async (results)=>{
        if(!(results.status==200)){return;}
        let musics = [];
        for(let i in results.data.abslist){
            const {ARTIST:artist,DC_TARGETID:rid,SONGNAME:name,web_albumpic_short:pic} = results.data.abslist[i];
			if(!pic){musics[i]={author: artist,rid,name,pic: '/bt.avif'};}
			else{musics[i]={author: artist,rid,name,pic: 'http://img1.kwcdn.kuwo.cn/star/albumcover/'+pic};}
        }
        return ress={status: 200,msg: '获取成功~',data: musics};
    }).catch((e)=>{return ress={status: -200,msg: '请求错误'};});
    return res.send(ress);
}
exports.getMusicUrl=async (req,res)=>{
    let ress = {status: -200,msg: '获取失败'};
    let info = {};
	let rid=req.query.rid;
    await axios.get('https://mobi.kuwo.cn/mobi.s', {
        params: {
            rid,
            f: 'web',
			type: 'convert_url_with_sign',
            source: 'kwplayer_ar_5.1.0.0_B_jiakong_vh.apk'
        }
    }).then((results)=>{
        if(!(results.status==200)){return;}
        if(!(results.data.code==200)){return ress={status: results.data.code,msg: results.data.msg};}
        info.url = results.data.data.url;
        ress = {status: 200,msg: '获取成功~'};
    }).catch((e)=>{return ress = {status: -200,msg: '请求错误'}});
    if(!(ress.status==200)){return res.send(ress);}
    info.rid=rid;
    info.isPlay=false;
    const {author,pic,name}=await getMusicInfo(rid);
    info.author=author;
    info.name=name;
    info.pic=pic;
    ress={status: 200,msg: '获取成功~',data: {...info,lrc: await getMusicLrc(rid)}};
    return res.send(ress);
};
exports.selectCollections=async (req,res)=>{
    let ress = {status: -200,msg: '获取失败'};
    let data = await selectCollections(req.query.lid,req.user.id);
    res.send({status:200,data}||ress);
};
exports.isCollect=async (req,res)=>{
    let ress = {status: -200,msg: '获取失败'};
    res.send({status: 200,msg: 'success',data: {...await isCollect(req.query.rid,req.query.lid,req.user.id)||ress}});
};
exports.collectMusic=async (req,res)=>{
    const {name,author,rid,pic,lid} = req.body;
    res.send({status: 200,msg: 'success',data: {...await collectMusic(name,author,rid,pic,lid,req.user.id)||''}});
};
exports.deleteCollect=async (req,res)=>{
    const {rid,lid} = req.body;
    res.send(await deleteCollections(rid,lid,req.user.id));
};
exports.addPlays=async (req,res)=>{
    res.send(await increasePlays(req.user.id));
};
exports.selectLists=async (req,res)=>{
    res.send(await selectLists(req.user.id));
};
exports.switchMusic=async (req,res)=>{
  const {next,rid,lid} = req.query;
  let lists = await selectCollections(lid,req.user.id);
  for(var i=0;i<lists.length;i++){
    if(lists[i]['rid']==rid){break;}
  }
  if(next===true){
    if(i>=lists.length-1){i=0;}else{i+=1;}
  }else{
    if(i<=0){i=lists.length-1;}else{i-=1;}
  }
  res.send({status: 200,msg: '获取成功~',data: lists[i]});
};
exports.createList=async (req,res)=>{
  const {name} = req.query;
  res.send(await createList(name,req.user.id));
};