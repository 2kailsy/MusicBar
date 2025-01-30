const superagent=require('superagent');
const cheerio=require('cheerio');
const { text } = require('body-parser');
function replaceText(text){return text.replace(/\n/g, "").replace(/\s/g, "");}
function replaceSlash(text){return text.replace(/u002F/g, "").replace(/\s/g,"");}
/*
	爬取play_detail页面获得歌曲信息
*/
exports.getMusicInfo = async (rid) => {
    let url = 'https://www.kuwo.cn/play_detail/' + rid;
    try{
        let res = await superagent.get(url);
        let $ = cheerio.load(res.text);
        let data = {
            author: replaceText($('p.artist_name').find('span.name').text()),
            name: replaceText($('p.song_name').find('span.name').text()),
            pic: replaceSlash(res.text.substring(res.text.indexOf('pic120')+8,res.text.indexOf('albuminfo')-2))
        };
        return data;
    }catch(err){throw Error(err);}
};