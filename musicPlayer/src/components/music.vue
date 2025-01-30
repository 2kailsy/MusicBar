<script setup>
    import { reactive,ref,watch,onMounted,getCurrentInstance } from 'vue';
    const { proxy } = getCurrentInstance();
    const { ipcRenderer } = require('electron');
    const ipc=(n,v=null,toString=false)=>{
        if(toString){v=JSON.stringify(v);}
        ipcRenderer.send(n,v);
    };
    /*
        *name: 音乐名
        *author: 作者名
        *url: 音乐地址(mp3)
        *pic: 音乐封面地址
        *isPlay: 是否在播放
        *isLove: 是否收藏
    */
    let musicInfo = reactive({
        info:{
            name: '请点歌~',
            pic: '/src/assets/fav.png'
        }
    });
    const rePlay=()=>{
        if(music){
            music.play();
            musicInfo.info.isPlay=true;
        }
    }
    let music;
    const nextMusic=(next=true)=>{
        const list = JSON.parse(localStorage.getItem('listInfo'));
        if(list!=null&&list.list!=null&&list.now!=null){
            proxy.axios({
                method: 'GET',
                url: `${proxy.apiUrl}/music/switch?next=${next}&rid=${musicInfo.info.rid}&lid=${list.list[list.now].lid||0}`,
                headers: {'Authorization': musicInfo.info.token||localStorage.getItem('token')||''}
            }).then(res=>{
                if(res.data.status&&res.data.status==1){return loginCheck();}
                if(res.data.status&&res.data.status==200){
                    if(res.data.data!=null){
                        playMusic(res.data.data.rid,res.data.data.url||null,true);
                    }else{
                        rePlay();
                    }
                }
            }).catch(()=>{rePlay();});
        }else{rePlay();}
    }
    function play(go=false){
        const lists = JSON.parse(localStorage.getItem('listInfo')||null);
        if(lists!=null&&lists.list!=null&&lists.now!=null){
            let info = lists.list[lists.now||0];
            isCollect(musicInfo.info.rid,info.lid);
        }
        // 播放/暂停音乐
        if(music){
            openLrc();
            music.pause();
            if(go===true){
                music.play();
                musicInfo.info.isPlay=true;
                return;
            }
            if(musicInfo.info.isPlay===true){
                music.pause();
                musicInfo.info.isPlay=false;
            }else if(musicInfo.info.isPlay===false){
                music.play();
                musicInfo.info.isPlay=true;
            }
        }
    }
    const toast=(status,content,duration=2000)=>{
        let color;
        switch (status) {
            case 200: color='rgb(2, 187, 79)';break;
            case -200: color='rgb(255, 96, 96)';break;
            default: color='rgb(255, 239, 58)';break;
        }
        ipc('toast:show',{content,duration,color});
        setTimeout(()=>{
            ipc('toast:hide');
        },duration);
    }
    // 搜索音乐
    let musicList = reactive({musics: []});
    const serachMusic=(name)=>{
        if(!name){return musicList.musics=[];}
        proxy.axios({
            method: 'GET',
            url: `${proxy.apiUrl}/music/searchMusic?musicName=${name}`,
            headers: {'Authorization': userInfo.info.token||localStorage.getItem('token')}
        }).then((response)=>{
            if(!(response.data.status==200)) return toast(-200,response.data.msg);
            if(response.data.status&&response.data.status==1) return loginCheck();
            if(!(response.data.status==200)) return toast(-200,'搜索失败');
            if(response.data.data.length>0){musicList.musics=response.data.data}else{musicList.musics=[];}
            playMusic(response.data.data[0].rid,null,true);
            lrcs.lrc={};
        });
    }
    // 获取窗口信息
    ipc('windowInfo:music:get');
    let windowInfo = reactive({
        canRemove: false,
        searchUI: false,
        opacity: 0
    });
    ipcRenderer.on('windowInfo:music:result',async (e,res)=>{
        //窗口信息
        for(let i in res){
            windowInfo[i]=res[i];
        }
    });
    // 收藏音乐
    const collectMusic=()=>{
        const {name,author,rid,pic} = musicInfo.info;
        const list = JSON.parse(localStorage.getItem('listInfo')||null);
        if(!name||!author||!rid||!pic||list==null||!list.list[list.now].lid){return;}
        const infos = new URLSearchParams();
        infos.append('name',name);
        infos.append('author',author);
        infos.append('rid',rid);
        infos.append('pic',pic);
        infos.append('lid',list.list[list.now].lid);
        proxy.axios({
            method: 'POST',
            url: `${proxy.apiUrl}/music/collect`,
            headers: {'Authorization': userInfo.info.token||localStorage.getItem('token')},
            data: infos
        }).then((response)=>{
            if(response.data.status&&response.data.status==1){return loginCheck();}
            if(!response.data.data.status){return toast(-200,'ERROR!');}
            if(response.data.data.status&&!(response.data.data.status==200)){return toast(response.data.data.status,response.data.data.msg);}
            toast(200,'收藏成功~');
            ipc('music:collect');
            isCollect(rid,list.list[list.now].lid);
        });
    }
    const isCollect=(rid,lid)=>{
        proxy.axios({
            method: 'GET',
            url: `${proxy.apiUrl}/music/isInList?rid=${rid}&lid=${lid}`,
            headers: {'Authorization': userInfo.info.token||localStorage.getItem('token')}
        }).then((response)=>{
            if(!response.data){return;}
            if(response.data.status&&response.data.status==1){return loginCheck();}
            if(response.data.status&&response.data.status==-4078){return toast(response.data.status,'数据库链接失败');}
            musicInfo.info.isLove=response.data.data.in;
        });
    }
    // 播放收藏音乐
    ipcRenderer.on('music:play',async (e,res)=>{
        lrcInfo.line=0;
        playMusic(res.rid,null,true);
    });
    // 刷新
    const refresh=()=>{
        const list = JSON.parse(localStorage.getItem('listInfo')||null);
        isCollect(musicInfo.info.rid,list.list[list.now].lid||0);
    }
    ipcRenderer.on('music:refresh',()=>{
        refresh();
    });
    // 播放搜索列表的音乐
    let musicName = ref('');
    const playMusic=async (rid,url,go=false,currentTime=null)=>{
        if(!url&&!rid) return toast(-200,'播放失败');
        if(!url){
            await proxy.axios({
                method: 'GET',
                url: `${proxy.apiUrl}/music/getMusicUrl?rid=${rid}`,
                headers: {'Authorization': userInfo.info.token}
            }).then((rs)=>{
                if(rs.data.status==1){return loginCheck();}
                if(!(rs.data.status==200)){toast(-200,'播放失败');rePlay();return;}
                musicInfo.info=rs.data.data;
                if(rs.data.data.lrc&&rs.data.data.lrc.length>0){lrcs.lrc=rs.data.data.lrc}else{lrcs.lrc={};}
                playMusic(musicInfo.info.rid,musicInfo.info.url,go,currentTime);
            });
            return;
        }
        refresh();
        if(music) music.pause();music=null;
        music=new Audio(url);
        if(currentTime!=null){
            if(!music) return;
            music.currentTime= currentTime;
        }
        play(go);
    }
    // 获取歌词
    let lrcs = reactive({lrc: []});
    let lrcInfo=reactive({
        line: 0
    });
    watch(()=>lrcs.lrc.length,(v)=>{
        if(v>0){openLrc();}
    });
    const findIndex=()=>{
        const currentTime = music.currentTime;
        for(let i=0;i<lrcs.lrc.length;i++){
            if(lrcs.lrc[i]['time']>currentTime) return i-1
        }
        if(lrcs.lrc.length<=0){return 0;}
        return lrcs.lrc.length-1;
    }
    const openLrc=()=>{
        if(music&&lrcs.lrc.length>0){
            lrcInfo.line=0;
            const doms={
                parent: document.querySelector('#lrc'),
                ul: document.querySelector('.lrc_item')
            };
            music.ontimeupdate=()=>{
                plan.percentum=(music.currentTime / music.duration)*100;
                localStorage.setItem('musicInfo',JSON.stringify({
                    rid: musicInfo.info.rid,
                    percentum: music.currentTime
                }));
                lrcInfo.line=findIndex();
                let lrcHeight=doms.parent.clientHeight,
                    currentIndex=findIndex(),
                    liHeight=doms.ul.children[0].clientHeight,
                    maxOffset=doms.ul.clientHeight - lrcHeight + liHeight,
                    offset=liHeight * currentIndex + liHeight / 2 - lrcHeight / 2;
                const li = doms.ul.querySelector('.now_play');
                if(li) li.classList.remove('now_play');
                currentIndex=currentIndex<0?0:currentIndex;
                doms.ul.children[currentIndex].classList.add('now_play');
                if(offset<=0){offset=0;}
                if(offset>=maxOffset){offset=maxOffset;}
                doms.ul.style.transform=`translateY(-${offset}px)`;
            };
        }
    }
    // 歌曲播放进度
    const plan=reactive({
        percentum: 0
    });
    watch(()=>plan.percentum,(v)=>{
        if(!(v>=100)) return;
        nextMusic();
        if(!userInfo.info.id){return;}
        proxy.axios({
            method: 'GET',
            url: `${proxy.apiUrl}/music/addPlays`,
            headers: {'Authorization': userInfo.info.token||localStorage.getItem('token')}
        }).then((rs)=>{
            if(rs.data.status&&rs.data.status==1){loginCheck();}
        });
    });
    // 上次播放
    const lastPlay=async ()=>{
        const _musicInfo = localStorage.getItem('musicInfo')||undefined;
        if(_musicInfo){
            const musicInfo=JSON.parse(_musicInfo);
            if(musicInfo.status&&!(musicInfo.status==200)){return;}
            if(music){music.pause();}
            await playMusic(musicInfo.rid,'',true,musicInfo.percentum);
        }
    }
    // 登陆检测
    let userInfo = reactive({
        info: {}
    });
    const loginCheck=()=>{
        const token = localStorage.getItem('token');
        proxy.axios({
            method: 'GET',
            url: `${proxy.apiUrl}/user/getUserInfo`,
            headers: {'Authorization': token}
        }).then((res)=>{
            if(res.data.status==200){
                windowInfo.opacity= 1;
                // 获取用户信息
                userInfo.info=res.data.data;
                userInfo.info.token=token;
                localStorage.setItem('token',userInfo.info.token);
                toast(200,`欢迎${userInfo.info.username||''}~`);
                lastPlay();
                return;
            };
            windowInfo.opacity= 0;
            ipc('music:hide');
            ipc('login:show');
            toast(-200,'请先登录');
            setTimeout(()=>{
                ipc('music:close');
            },2000);
            musicInfo.info.isPlay=false;
            if(music){music.pause();}
        });
        // localStorage.clear();
    };
    onMounted(()=>{
        loginCheck();
        setTimeout(() => {
            windowInfo.opacity=1;
        }, 200);
        if(document.querySelector('.music').clientHeight>100){
            windowInfo.searchUI=true;
        };
        let listInfo = JSON.parse(localStorage.getItem('listInfo')||null);
        if(!listInfo||!listInfo.list||!listInfo.now){
            proxy.axios({
                method: 'GET',
                url: `${proxy.apiUrl}/music/getLists`,
                headers: {'Authorization': userInfo.info.token||localStorage.getItem('token')}
            }).then((rs)=>{
                if(rs.data.status==1){return loginCheck();}
                if(!(rs.data.status==200&&rs.data.list.length>0)){return toast(-200,'暂无信息');}
                localStorage.setItem('listInfo',JSON.stringify({list: rs.data.list||{},now: 0}));
            });
        }
        // 字体链接
        var localhostPaht = `${location.protocol}//${location.host}`;
        let style = document.createElement('style');
        style.innerText=`@font-face {font-family: musicFont;src: url('${localhostPaht}/musicFont.ttf')}`;
        document.head.appendChild(style);
        // 右键菜单
        const remote = require("@electron/remote")
        const Menu = remote.Menu
        const menu_tpl = [
            {
                label:"下载",
                accelerator:'ctrl + d',
                click: ()=>{
                    downloadMusic(musicInfo.info.url||undefined);
                }
            },
            {
                label:"收藏",
                accelerator:'ctrl + c',
                click: ()=>{
                    collectMusic();
                }
            },
            {
                label:"操作",
                submenu: [{
                    label: '上一曲',
                    accelerator: 'ctrl + alt + left',
                    click: ()=>{
                        nextMusic(false);
                    }
                },{
                    label: '暂停',
                    accelerator: 'f5',
                    click: ()=>{
                        if(musicInfo.info.isPlay===true){
                            if(music){music.pause();musicInfo.info.isPlay=false;}
                        }else{
                            if(music){music.play();musicInfo.info.isPlay=true;}
                        }
                    }
                },{
                    label: '下一曲',
                    accelerator: 'ctrl + alt + right',
                    click: ()=>{
                        nextMusic(true);
                    }
                }]
            }
        ]
        const context_menu = Menu.buildFromTemplate(menu_tpl)
        Menu.setApplicationMenu(context_menu);
        document.oncontextmenu=()=>{
            //弹出右键菜单
            context_menu.popup({
                window:remote.getCurrentWindow()
            })
        }
    });
    // 个人中心
    const lookUserInfo=(uid)=>{
        if(uid=undefined){return;}
        ipc('userCenter:open',uid);
    }
    // 关闭隐藏动画
    const close=(m)=>{
        windowInfo.opacity=0;
        setTimeout(() => {
            if(m==0){ipc('music:close');}
            else{ipc('music:minsize');}
        }, 200);
    }
    ipcRenderer.on('music:restore',()=>{
        setTimeout(() => {
            windowInfo.opacity=1;
        }, 200);
    });
    // 下载音乐
    let innerToast = reactive({
        settings: {
            show: false,
            content: '',
            color: ''
        }
    });
    const downloadMusic=(url=undefined)=>{
        const sp = url.split('/');
        const extendes = sp[sp.length-1];
        const _extend = extendes.split('.');
        const extend = '.'+_extend[_extend.length-1];
        let now = new Date();
        const ymd = {
            YYYY: now.getFullYear(),
            MM: now.getMonth()+1,
            dd: now.getDate(),
            hh: now.getHours(),
            mm: now.getMinutes(),
            ss: now.getSeconds()
        }
        now = '';
        for(let i in ymd){
            ymd[i]=ymd[i]<10?`0${ymd[i]}`:ymd[i];
            now+=String(ymd[i]);
        }
        const fileName = musicInfo.info.name+'_'+musicInfo.info.author+extend;
        ipc('music:download',{url,fileName},true);
        innerToast.settings.show=true;
        innerToast.settings.content='正在下载...';
        innerToast.settings.color='rgb(255, 239, 58)';
    }
    ipcRenderer.on('download:result',(e,data)=>{
        innerToast.settings.show=false;
        if(!(data.status==200)){return toast(-200,data.msg||'ERROR')}
        toast(200,'下载完成');
    });
</script>

<template>
    <div class="music" :style="`${windowInfo.canRemove?'-webkit-app-region: no-drag;':''}opacity: ${windowInfo.opacity};`">
        <div class="topbar samllbar" :style="`${windowInfo.canRemove?'-webkit-app-region: no-drag;':''}`">
            <div class="top-item">
                <svg v-show="!userInfo.info.img" t="1679483780670" @click="lookUserInfo(userInfo.info.id)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4959" width="30" height="22"><path d="M870.071 216.042c18.748 0 34 15.252 34 34v523.916c0 18.748-15.252 34-34 34H153.929c-18.748 0-34-15.252-34-34V250.042c0-18.748 15.252-34 34-34h716.142m0-56H153.929c-49.706 0-90 40.294-90 90v523.916c0 49.706 40.294 90 90 90h716.143c49.706 0 90-40.294 90-90V250.042c-0.001-49.705-40.295-90-90.001-90z" fill="" p-id="4960"></path><path d="M478.953 522.602c20.776-21.575 33.556-50.905 33.556-83.223 0-66.274-53.726-120-120-120s-120 53.726-120 120c0 32.318 12.78 61.648 33.556 83.223-67.175 32.247-113.556 100.907-113.556 180.401h56c0-38.464 14.979-74.625 42.177-101.823 25.543-25.543 58.993-40.307 94.831-42.009 2.314 0.133 4.644 0.208 6.992 0.208s4.678-0.075 6.992-0.208c35.838 1.702 69.288 16.465 94.831 42.009 27.198 27.198 42.177 63.36 42.177 101.823h56c0-79.494-46.381-148.153-113.556-180.401z m-150.444-83.223c0-35.29 28.71-64 64-64s64 28.71 64 64c0 33.3-25.568 60.729-58.102 63.717-1.96-0.057-3.925-0.093-5.898-0.093s-3.938 0.036-5.898 0.093c-32.534-2.988-58.102-30.417-58.102-63.717zM832.47 348c0 15.4-12.6 28-28 28H620.509c-15.4 0-28-12.6-28-28s12.6-28 28-28H804.47c15.4 0 28 12.6 28 28zM832.47 479.982c0 15.4-12.6 28-28 28H679.727c-15.4 0-28-12.6-28-28s12.6-28 28-28H804.47c15.4 0 28 12.6 28 28z" fill="" p-id="4961"></path><path d="M832.47 611.965c0 15.4-12.6 28-28 28h-70.135c-15.4 0-28-12.6-28-28s12.6-28 28-28h70.135c15.4 0 28 12.6 28 28z" p-id="4962"></path></svg>
                <img v-show="userInfo.info.img" :src="userInfo.info.img" @click="lookUserInfo(userInfo.info.id)" class="icon head_img" @error="userInfo.info.img=''">
                <div class="search">
                    <input type="text" class="search_input" v-model="musicName" @keyup.enter="serachMusic(musicName)">
                    <svg t="1678875838491" style="min-width: 18px;" class="icon" @click="serachMusic(musicName)" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2021" width="20" height="20"><path d="M966.4 924.8l-230.4-227.2c60.8-67.2 96-156.8 96-256 0-217.6-176-390.4-390.4-390.4-217.6 0-390.4 176-390.4 390.4 0 217.6 176 390.4 390.4 390.4 99.2 0 188.8-35.2 256-96l230.4 227.2c9.6 9.6 28.8 9.6 38.4 0C979.2 950.4 979.2 934.4 966.4 924.8zM102.4 441.6c0-185.6 150.4-339.2 339.2-339.2s339.2 150.4 339.2 339.2c0 89.6-35.2 172.8-92.8 233.6-3.2 0-3.2 3.2-6.4 3.2-3.2 3.2-3.2 3.2-3.2 6.4-60.8 57.6-144 92.8-233.6 92.8C256 780.8 102.4 627.2 102.4 441.6z" p-id="2022"></path></svg>
                </div>
                <svg t="1678876997628" @click="ipc('music:searchUI:open');windowInfo.searchUI=true;" v-show="!windowInfo.searchUI" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2249" width="23" height="23"><path d="M631.616 216.544l2.496 2.624 166.976 193.568a32 32 0 0 1-45.632 44.672l-2.816-2.88-110.72-128.384v451.328a32 32 0 0 1-28.288 31.808l-3.744 0.192a32 32 0 0 1-31.776-28.256l-0.224-3.744V240.064c0-28.416 33.856-42.176 53.728-23.52z m-240.64-8.544a32 32 0 0 1 31.776 28.256l0.224 3.744v537.408c0 28.416-33.856 42.208-53.728 23.52l-2.496-2.624L199.776 604.8a32 32 0 0 1 45.632-44.704l2.816 2.88 110.752 128.384V240a32 32 0 0 1 28.256-31.776l3.744-0.224z" p-id="2250"></path></svg>
                <svg t="1678876997628" @click="ipc('music:searchUI:close');windowInfo.searchUI=false;" v-show="windowInfo.searchUI" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2249" width="23" height="23"><path d="M631.616 216.544l2.496 2.624 166.976 193.568a32 32 0 0 1-45.632 44.672l-2.816-2.88-110.72-128.384v451.328a32 32 0 0 1-28.288 31.808l-3.744 0.192a32 32 0 0 1-31.776-28.256l-0.224-3.744V240.064c0-28.416 33.856-42.176 53.728-23.52z m-240.64-8.544a32 32 0 0 1 31.776 28.256l0.224 3.744v537.408c0 28.416-33.856 42.208-53.728 23.52l-2.496-2.624L199.776 604.8a32 32 0 0 1 45.632-44.704l2.816 2.88 110.752 128.384V240a32 32 0 0 1 28.256-31.776l3.744-0.224z" fill="rgb(2, 187, 79)" p-id="2250"></path></svg>
                <svg t="1678621129508" @click="ipc('collections:open')" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2139" width="20" height="20"><path d="M281.6 838.4c0 19.2 19.2 38.4 38.4 38.4l608 0c19.2 0 38.4-19.2 38.4-38.4l0-25.6c0-19.2-19.2-38.4-38.4-38.4l-608 0c-19.2 0-38.4 19.2-38.4 38.4L281.6 838.4zM140.8 748.8c-38.4 0-76.8 32-76.8 76.8C64 864 96 896 140.8 896c38.4 0 76.8-32 76.8-76.8C211.2 780.8 179.2 748.8 140.8 748.8zM281.6 524.8c0 19.2 19.2 38.4 38.4 38.4l608 0c19.2 0 38.4-19.2 38.4-38.4L966.4 499.2c0-19.2-19.2-38.4-38.4-38.4L320 460.8c-19.2 0-38.4 19.2-38.4 38.4L281.6 524.8zM140.8 435.2C96 435.2 64 473.6 64 512c0 38.4 32 76.8 76.8 76.8 38.4 0 76.8-32 76.8-76.8C211.2 473.6 179.2 435.2 140.8 435.2zM320 153.6c-19.2 0-38.4 19.2-38.4 38.4l0 25.6c0 19.2 19.2 38.4 38.4 38.4l608 0c19.2 0 38.4-19.2 38.4-38.4L966.4 185.6c0-19.2-19.2-38.4-38.4-38.4L320 147.2zM140.8 128C96 128 64 160 64 198.4c0 38.4 32 76.8 76.8 76.8 38.4 0 76.8-32 76.8-76.8C211.2 160 179.2 128 140.8 128z" p-id="2140"></path></svg>
                <svg t="1678605881130" @click="collectMusic()" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2727" width="20" height="20"><path d="M518.88 287.61l35.48 71.88 79.32 11.52-57.4 55.96 13.55 79-70.95-37.3-70.95 37.3 13.55-79-57.4-55.96 79.33-11.52z" fill="#ffffff" p-id="2728"></path><path d="M783.27 952.69c-20.29 0-39.66-7.98-54.16-22.54L547.15 747.4c-13.95-14.01-36.78-14.15-50.9-0.33L310.59 928.83c-16.88 16.52-40.01 24.21-63.48 21.12-22.93-3.03-42.77-16.07-54.42-35.79-15.56-26.34-23.79-56.42-23.79-86.98V247.73c0-94.88 77.19-172.08 172.08-172.08h359.51c94.88 0 172.08 77.19 172.08 172.08v579.45c0 32.41-9.2 64.05-26.59 91.5-11.95 18.85-31.71 31.08-54.21 33.54-2.85 0.31-5.69 0.47-8.5 0.47zM521.52 667.93h0.69c27.87 0.18 54.05 11.15 73.72 30.91l181.96 182.75c2.43 2.44 5.5 2.32 6.38 2.22 2.49-0.27 3.3-1.56 3.57-1.98 10.4-16.4 15.9-35.3 15.9-54.64V247.73c0-56.93-46.32-103.25-103.25-103.25H340.97c-56.93 0-103.25 46.32-103.25 103.25v579.45c0 18.25 4.92 36.22 14.22 51.97 0.86 1.45 2.26 2.31 4.17 2.56 1.11 0.15 3.96 0.24 6.32-2.07L448.1 697.89c19.75-19.34 45.81-29.96 73.42-29.96z" p-id="2729"></path><path d="M520.16 236.63l-50.49 102.3-112.9 16.41 81.69 79.63-19.28 112.44 100.98-53.09 100.97 53.09-19.28-112.44 81.69-79.63-112.9-16.41-50.48-102.3z" :fill="`${musicInfo.info.isLove?'#F7B52C':''}`" p-id="2730"></path></svg>
                <svg t="1678604493746" @click="ipc('windowInfo:music:setAlwaysOnTop',false)" v-show="windowInfo.alwaysOnTop" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2291" width="20" height="20"><path d="M480 896V250.4L237.6 493.6 192 448l274.4-274.4L512 128l45.6 45.6L832 448l-45.6 45.6L544 250.4V896h-64z" p-id="2292" fill="rgb(2, 187, 79)"></path></svg>
                <svg t="1678604493746" @click="ipc('windowInfo:music:setAlwaysOnTop',true)" v-show="!windowInfo.alwaysOnTop" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2291" width="20" height="20"><path d="M480 896V250.4L237.6 493.6 192 448l274.4-274.4L512 128l45.6 45.6L832 448l-45.6 45.6L544 250.4V896h-64z" p-id="2292"></path></svg>
                <svg t="1678511188153" @click="close(1)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3607" width="20" height="20"><path d="M449.92 543.36C449.92 520.96 431.36 512 410.24 512L97.92 512c-17.92 0-32 14.08-32 32 0 17.92 14.08 32 32 32l242.56 0-267.52 267.52c-12.16 12.16-12.16 31.36 0 43.52 12.16 12.16 31.36 12.16 43.52 0l269.44-269.44 0 246.4c0 17.92 14.08 32 32 32 17.92 0 32-14.08 32-32l0-320M865.92 384 622.72 384l267.52-267.52c12.16-12.16 12.16-31.36 0-43.52-12.16-12.16-31.36-12.16-43.52 0L577.92 342.4 577.92 96C577.92 78.08 563.2 64 545.92 64c-17.92 0-32 14.08-32 32l0 320c0 0.64 0.64 1.28 0.64 1.92 0 8.32 2.56 16.64 8.96 22.4C531.2 448.64 542.72 451.2 552.96 448l312.32 0c17.92 0 32-14.08 32-32C897.92 398.08 883.2 384 865.92 384z" p-id="3608"></path></svg>
                <svg t="1678511160839" @click="windowInfo.canRemove=false" v-show="windowInfo.canRemove" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3431" width="20" height="20"><path d="M512 128a224 224 0 0 1 224 224v64h64a64 64 0 0 1 64 64v352a64 64 0 0 1-64 64H224a64 64 0 0 1-64-64V480a64 64 0 0 1 64-64h64v-64a224 224 0 0 1 224-224z m288 704V480H224v352h576z m-259.872-280.928V768h-57.92v-216.928h57.92zM512 192a160 160 0 0 0-159.84 153.056L352 416h320v-64a160 160 0 0 0-153.056-159.84L512 192z" p-id="3432"></path></svg>
                <svg t="1678512389068" @click="windowInfo.canRemove=true" v-show="!windowInfo.canRemove" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3749" width="20" height="20"><path d="M426.666667 565.333333a21.333333 21.333333 0 0 0-21.333334 21.333334v128a21.333333 21.333333 0 0 0 42.666667 0v-128a21.333333 21.333333 0 0 0-21.333333-21.333334zM734.293333 130.346667A192 192 0 0 0 512 320v42.666667a21.333333 21.333333 0 0 0 42.666667 0v-37.12a153.386667 153.386667 0 0 1 129.28-153.6A149.333333 149.333333 0 0 1 853.333333 320v42.666667a21.333333 21.333333 0 0 0 42.666667 0v-36.906667a195.84 195.84 0 0 0-161.706667-195.413333z" p-id="3750"></path><path d="M609.706667 405.333333H243.626667A115.626667 115.626667 0 0 0 128 520.96v259.413333A115.626667 115.626667 0 0 0 243.626667 896h366.08A115.626667 115.626667 0 0 0 725.333333 780.373333V520.96A115.626667 115.626667 0 0 0 609.706667 405.333333zM682.666667 780.373333A72.96 72.96 0 0 1 609.706667 853.333333H243.626667A72.96 72.96 0 0 1 170.666667 780.373333V520.96A72.96 72.96 0 0 1 243.626667 448h366.08A72.96 72.96 0 0 1 682.666667 520.96z" p-id="3751"></path></svg>
                <svg t="1678511091722" @click="close(0)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3255" width="20" height="20"><path d="M557.311759 513.248864l265.280473-263.904314c12.54369-12.480043 12.607338-32.704421 0.127295-45.248112-12.512727-12.576374-32.704421-12.607338-45.248112-0.127295L512.127295 467.904421 249.088241 204.063755c-12.447359-12.480043-32.704421-12.54369-45.248112-0.063647-12.512727 12.480043-12.54369 32.735385-0.063647 45.280796l262.975407 263.775299-265.151458 263.744335c-12.54369 12.480043-12.607338 32.704421-0.127295 45.248112 6.239161 6.271845 14.463432 9.440452 22.687703 9.440452 8.160624 0 16.319527-3.103239 22.560409-9.311437l265.216826-263.807983 265.440452 266.240344c6.239161 6.271845 14.432469 9.407768 22.65674 9.407768 8.191587 0 16.352211-3.135923 22.591372-9.34412 12.512727-12.480043 12.54369-32.704421 0.063647-45.248112L557.311759 513.248864z" p-id="3256"></path></svg>
            </div>
        </div>
        <div class="search_box" v-show="windowInfo.searchUI">
            <span v-show="musicList.musics.length<=0&&lrcs.lrc.length<=0" style="color: rgba(110,110,110,0.5);position: fixed;top:50%;left:50%;transform: translate(-50%,-50%);">空空如也~</span>
            <div class="musics" v-show="windowInfo.searchUI&&musicList.musics.length>0">
                <div class="music_item" v-for="(music,i) in musicList.musics" :key="i">
                    <div class="music-pic" style="width:50px;height:50px;">
                        <img :src="music.pic">
                    </div>
                    <div class="music-info">
                        <div class="music-name" style="font-size: 18px;">{{ music.name }}</div>
                        <div class="music-artist" style="font-size: 12px;">{{ music.author }}</div>
                    </div>
                    <div class="music-func">
                        <div class="btn">
                            <svg t="1678510926711" @click="playMusic(music.rid)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3113" width="30" height="30"><path d="M512 42.666667C252.793333 42.666667 42.666667 252.793333 42.666667 512s210.126667 469.333333 469.333333 469.333333 469.333333-210.126667 469.333333-469.333333S771.206667 42.666667 512 42.666667z m0 896c-235.64 0-426.666667-191.026667-426.666667-426.666667s191.026667-426.666667 426.666667-426.666667 426.666667 191.026667 426.666667 426.666667-191.026667 426.666667-426.666667 426.666667z m-74.666667-213.38a53.373333 53.373333 0 0 1-53.333333-53.333334V352.066667A53.333333 53.333333 0 0 1 467.373333 308L702 467.933333a53.333333 53.333333 0 0 1 0 88.133334L467.373333 716a53.286667 53.286667 0 0 1-30.04 9.286667z m0.08-383.933334a11.093333 11.093333 0 0 0-5.08 1.28 10.446667 10.446667 0 0 0-5.666666 9.433334v319.866666a10.666667 10.666667 0 0 0 16.666666 8.82l234.666667-159.94a10.666667 10.666667 0 0 0 0-17.626666l-234.666667-159.933334a10.313333 10.313333 0 0 0-5.906666-1.92z" fill="#fff" p-id="3114"></path></svg>
                            <!-- <svg t="1678712126266" @click="deleteMusic(music.rid,false)" class="icon delete" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2170" width="20" height="20"><path d="M840 288H688v-56c0-40-32-72-72-72h-208C368 160 336 192 336 232V288h-152c-12.8 0-24 11.2-24 24s11.2 24 24 24h656c12.8 0 24-11.2 24-24s-11.2-24-24-24zM384 288v-56c0-12.8 11.2-24 24-24h208c12.8 0 24 11.2 24 24V288H384zM758.4 384c-12.8 0-24 11.2-24 24v363.2c0 24-19.2 44.8-44.8 44.8H332.8c-24 0-44.8-19.2-44.8-44.8V408c0-12.8-11.2-24-24-24s-24 11.2-24 24v363.2c0 51.2 41.6 92.8 92.8 92.8h358.4c51.2 0 92.8-41.6 92.8-92.8V408c-1.6-12.8-12.8-24-25.6-24z" fill="#fff" p-id="2171"></path><path d="M444.8 744v-336c0-12.8-11.2-24-24-24s-24 11.2-24 24v336c0 12.8 11.2 24 24 24s24-11.2 24-24zM627.2 744v-336c0-12.8-11.2-24-24-24s-24 11.2-24 24v336c0 12.8 11.2 24 24 24s24-11.2 24-24z" fill="#fff" p-id="2172"></path></svg> -->
                        </div>
                    </div>
                </div>
            </div>
            <div class="lrcs" id="lrc" v-show="windowInfo.searchUI&&musicList.musics.length<=0&&lrcs.lrc.length>0">
                <ul class="lrc_item">
                    <li :style="i==lrcInfo.line?'now_play':''" v-for="(lrc,i) in lrcs.lrc" :key="i">{{ lrc['lineLyric'] }}</li>
                </ul>
            </div>
        </div>
        <div class="music-player">
            <div :class="`music-pic isPlay ${musicInfo.info.isPlay?'':'isPuse'}`">
                <img :src="musicInfo.info.pic">
            </div>
            <div class="music-info">
                <div class="music-name overname">{{ musicInfo.info.name }}</div>
                <div class="music-artist overname">{{ musicInfo.info.author }}</div>
            </div>
            <div class="music-func">
                <div class="btn">
                    <svg t="1678510857050" @click="nextMusic(false)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2829" width="30" height="30"><path d="M76.442058 472.123804l479.972785-344.375282c31.816917-17.080004 68.268577-21.123087 68.295184 44.618197l0 149.899008 271.113573-194.517205c31.815893-17.080004 69.179357-17.590634 68.295184 46.384423l0 676.471912c-0.91078 57.779961-39.127716 66.168002-68.295184 47.295166L624.711051 703.367469l0 148.120502c-0.026607 56.012711-39.127716 65.284889-68.295184 46.411029L76.442058 553.481763C54.339786 531.021216 54.339786 494.597655 76.442058 472.123804zM907.552193 196.359156 568.143437 433.700703c0 0 0-186.833199 0-237.341546L115.598428 512.809435l452.545009 316.465628c0-13.244652 0-237.328243 0-237.328243l339.408757 237.328243C907.552193 816.029388 907.552193 246.867504 907.552193 196.359156z" p-id="2830"></path></svg>
                    <svg t="1678510877719" @click="play()" v-show="musicInfo.info.isPlay" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2971" width="30" height="30"><path d="M512 42.666667C252.793333 42.666667 42.666667 252.793333 42.666667 512s210.126667 469.333333 469.333333 469.333333 469.333333-210.126667 469.333333-469.333333S771.206667 42.666667 512 42.666667z m0 896c-235.64 0-426.666667-191.026667-426.666667-426.666667s191.026667-426.666667 426.666667-426.666667 426.666667 191.026667 426.666667 426.666667-191.026667 426.666667-426.666667 426.666667z m106.666667-213.333334a21.333333 21.333333 0 0 1-21.333334-21.333333V320a21.333333 21.333333 0 0 1 42.666667 0v384a21.333333 21.333333 0 0 1-21.333333 21.333333z m-213.333334 0a21.333333 21.333333 0 0 1-21.333333-21.333333V320a21.333333 21.333333 0 0 1 42.666667 0v384a21.333333 21.333333 0 0 1-21.333334 21.333333z" p-id="2972"></path></svg>
                    <svg t="1678510926711" @click="play()" v-show="!musicInfo.info.isPlay" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3113" width="30" height="30"><path d="M512 42.666667C252.793333 42.666667 42.666667 252.793333 42.666667 512s210.126667 469.333333 469.333333 469.333333 469.333333-210.126667 469.333333-469.333333S771.206667 42.666667 512 42.666667z m0 896c-235.64 0-426.666667-191.026667-426.666667-426.666667s191.026667-426.666667 426.666667-426.666667 426.666667 191.026667 426.666667 426.666667-191.026667 426.666667-426.666667 426.666667z m-74.666667-213.38a53.373333 53.373333 0 0 1-53.333333-53.333334V352.066667A53.333333 53.333333 0 0 1 467.373333 308L702 467.933333a53.333333 53.333333 0 0 1 0 88.133334L467.373333 716a53.286667 53.286667 0 0 1-30.04 9.286667z m0.08-383.933334a11.093333 11.093333 0 0 0-5.08 1.28 10.446667 10.446667 0 0 0-5.666666 9.433334v319.866666a10.666667 10.666667 0 0 0 16.666666 8.82l234.666667-159.94a10.666667 10.666667 0 0 0 0-17.626666l-234.666667-159.933334a10.313333 10.313333 0 0 0-5.906666-1.92z" p-id="3114"></path></svg>
                    <svg t="1678510796575" @click="nextMusic()" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2550" width="30" height="30"><path d="M947.557942 553.481763 467.585156 897.899c-29.166445 18.872836-68.267554 9.601682-68.295184-46.411029L399.289972 703.367469 128.175376 897.899c-29.166445 18.872836-67.384404 10.484795-68.295184-47.295166L59.880192 174.132946c-0.883149-63.975057 36.479291-63.464427 68.295184-46.384423l271.113573 194.517205L399.288949 172.366719c0.02763-65.741283 36.479291-61.698201 68.295184-44.618197l479.973809 344.375282C969.661238 494.597655 969.661238 531.021216 947.557942 553.481763zM116.44883 829.275064l339.408757-237.328243c0 0 0 224.082568 0 237.328243l452.545009-316.465628-452.545009-316.450279c0 50.508347 0 237.341546 0 237.341546L116.44883 196.359156C116.44883 246.867504 116.44883 816.029388 116.44883 829.275064z" p-id="2551"></path></svg>
                </div>
            </div>
        </div>
        <div class="music_plan" :style="`width: ${plan.percentum}%;height: ${windowInfo.searchUI?'74px':'100%'};`"></div>
        <div class="innerToast" v-show="innerToast.settings.show" :style="`color: ${innerToast.settings.color||'rgb(255, 239, 58)'}`">{{ innerToast.settings.content||'' }}</div>
    </div>
</template>

<style scoped>
    .innerToast{
        max-width: 80%;
        min-width: 20px;
        max-height: 60%;
        min-height: 40px;
        background-color: rgb(255, 0, 0);
        /* color: rgb(255, 239, 58); */
        position: fixed;
        top: 60%;
        left: 50%;
        transform: translate(-50%,-50%);
        border-radius: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 4px 12px;
        box-sizing: border-box;
        transition: .3s;
    }
    .music_plan{
        position: fixed;
        width: 0px;
        height: 100%;
        /* background-color: rgba(253, 107, 107, 0.711); */
        background-image: linear-gradient(90deg,rgba(255, 0, 0, 0.711),rgba(255, 0, 0, 0.711),rgba(253, 107, 107, 0.711));
        bottom: 0;
        left: 0;
        border-radius: 8px;
        z-index: -1;
        transition: .2s;
    }
    .music{
        background-color: rgba(0,0,0,0.2);
        border-radius: 8px;
        /* width: 420px;
        height: 104px; */
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        /* 拖动 */
        -webkit-app-region: drag;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        transition: .3s;
    }
    .music-player{
        /* background-color: #fff; */
        width: 100%;
        position: fixed;
        bottom: 0;
        left: 0;
        display: flex;
        align-items: center;
    }
    .music-pic{
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background-color: rgb(158, 158, 158);
        overflow: hidden;
        margin: 12px 12px 5px 12px;
        user-select: none;
    }
    .music-pic img{
        width: 100%;
        height: 100%;
        user-select: none;
    }
    .music-pic:hover,.music-player:hover .music-pic{
        box-shadow: 0px 0px 5px rgba(3, 255, 36, 0.5);
    }
    .isPlay{
        animation: playAni 5s linear infinite;
    }
    @keyframes playAni {
        0%{transform: rotate(0deg);}
        100%{transform: rotate(360deg);}
    }
    .music-info{
        flex: 1;
        overflow: hidden;
    }
    .music-name{
        color: rgb(2, 187, 79);
        font-size: 20px;
        font-weight: bold;
        user-select: none;
    }
    .overname{
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
    .music-artist{
        color: rgb(0,245,236);
        font-size: 14px;
        font-weight: 500;
        user-select: none;
    }
    .music-func{
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        -webkit-app-region: no-drag;
    }
    .isPuse{
        animation-play-state:paused;
    }
    .search input{
        outline: rgb(2, 187, 79);
        text-indent: 6px;
        width: 100%;
        border-radius: 8px 0 0 8px;
        border: none;
    }
    .search:hover{
        border: 1px solid rgb(2, 187, 79);
    }
    .search{
        display: flex;
        border: 1px solid rgba(178, 178, 178, 0.567);
        max-width: 100px;
        background-color: rgba(111, 111, 111, 0.5);
        -webkit-app-region: no-drag;
        border-radius: 8px;
        color: #fff;
        /* margin: 8px 0; */
        box-sizing: border-box;
        height: 100%;
        margin-right: 2px;
    }
    .search .icon{
        padding: 1px 3px;
    }
    .search .icon:hover{
        fill: rgb(2, 187, 79)!important;
    }
    .search_box{
        flex: 1;
        /* background-color: #fff; */
        margin-top: 40px;
        margin-bottom: 74px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    .music_item{
        display: flex;
        align-items: center;
    }
    .musics{
        /* background-color: #fff; */
        overflow: scroll;
        height: 100%;
        -webkit-app-region: no-drag;
    }
    /* 歌词 */
    .lrcs{
        color: rgb(239, 255, 246);
        padding: 18px;
        overflow: scroll;
        text-align: center;
        font-size: 26px;
        height: 100%;
        transition: .3s;
        user-select: none;
        padding-bottom: 74px;
        font-weight: 20;
    }
    .lrc_item li.now_play{
        color: rgb(2, 187, 79);
        /* transform: scale(1.5); */
        font-size: 27px;
    }
    .lrc_item{
        transition: .3s;
        list-style: none;
    }
    .lrc_item li{
        transition: .3s;
        height: 30px;
        line-height: 30px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'musicFont';
    }
    .head_img{
        border-radius: 50%;
        width: 24px;
        height: 24px;
        margin: 4px 8px 4px 4px;
        /* margin-right: 6px; */
        padding: 0;
    }
    .head_img:hover{
        box-shadow: 0px 0px 5px rgba(3, 255, 36, 0.5);
    }
</style>