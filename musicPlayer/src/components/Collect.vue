<script setup>
    import { reactive,onMounted,getCurrentInstance,ref } from 'vue';
    const {ipcRenderer} = require('electron');
    const {proxy} = getCurrentInstance();
    //与主线程通讯
    const ipc=(n,v=null)=>{
        ipcRenderer.send(n,JSON.parse(JSON.stringify(v)));
    };
    // 获取窗口信息
    const windowInfo = reactive({
        canRemove: false
    });
    ipcRenderer.on('windowInfo:collect:result',async (e,res)=>{
        for(let i in res){
            windowInfo[i]=res[i];
        }
    });
    // 提示框
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
    // 获取数据
    let collections = reactive({
        musics: [],
        lists: [{name: '默认'}],
        now: 0
    });
    const getlists=(get=false)=>{
        proxy.axios({
            method: 'GET',
            url: `${proxy.apiUrl}/music/getLists`,
            headers: {'Authorization': localStorage.getItem('token')}
        }).then((rs)=>{
            if(!(rs.data.status==200&&rs.data.list.length>0)){return toast(-200,'暂无信息');}
            const info = JSON.parse(localStorage.getItem('listInfo')||null);
            if(JSON.stringify(info.list)==JSON.stringify(rs.data.list)){
                collections.lists=info.list;
                collections.now=info.now;
                if(get===true){getListMusics(false,collections.now);}
                return;
            }
            collections.lists=rs.data.list;
            localStorage.setItem('listInfo',JSON.stringify({list: collections.lists,now: collections.now||0}));
        });
    }
    const getListMusics=(toBottom=false,index=null,lid=null)=>{
        if(!lid){
            const info = JSON.parse(localStorage.getItem('listInfo')||null);
            if(!info||info.list==null||collections.lists==null){return getlists(true);}
            if(index){
                lid = collections.lists[index].lid||info.list[index||0].lid;
                if(lid==null){return getlists(true);}
            }else{
                lid = collections.lists[collections.now||0].lid||info.list[info.now||0].lid;
                if(lid==null){return getlists(true);}
            }
        }
        proxy.axios({
            method: 'GET',
            url: `${proxy.apiUrl}/music/getList?lid=${lid}`,
            headers: {'Authorization': localStorage.getItem('token')}
        }).then((rs)=>{
            if(!(rs.data.status==200)){return toast(-200,'获取失败');}
            localStorage.setItem('listInfo',JSON.stringify({list: collections.lists,now: index}));
            collections.now=index;
            if(rs.data.data.length>0){collections.musics=rs.data.data}else{collections.musics=[]}
            if(toBottom==true){
                setTimeout(()=>{document.querySelector('.musics').scrollTop=document.querySelectorAll('.music_item').length*80;},1);
            }
            ipc('collect:re:music');
            selecter.settings.open=false;
        });
    }
    onMounted(()=>{
        const token = localStorage.getItem('token')||undefined;
        if(!token){
            animation.animations.height='0%';
            setTimeout(()=>{
                ipc('collect:close');
            },200);
            return;
        }
        ipc('windowInfo:collect:get');
        getlists(true);
        const info = JSON.parse(localStorage.getItem('listInfo')||null);
        if(!info||info.list==null||info.now==null||info.list[info.now]==null||info.list[info.now].lid==null||info.list[info.now].name==null){
            getlists(true);  
        }
        animation.animations.width='100%';
        setTimeout(()=>{
            animation.animations.height='100%';
        },200);
        const music = document.querySelector('.musics');
        music.addEventListener('scroll',(e)=>{
            if(music.scrollTop>=200){goTopShow.value=true;}else{goTopShow.value=false;}
        });
    });
    const play=(rid)=>{
        for(let i=0;i<collections['musics'].length;i++){
            if(collections['musics'][i]['rid']==rid){
                ipc('collect:play',{rid,listInfo: {listname: 'collections',length: collections['musics'].length-1,listIndex: i}});
                break;
            }
        }
    }
    // 删除收藏
    let tips = reactive({
        delete: {
            isShow: false,
            rid: null
        },
        createList: {
            isShow: false,
            name: null
        }
    });
    const deleteMusic=(rid,across)=>{
        if(across){
            const infos = new URLSearchParams();
            infos.append('rid',rid);
            infos.append('lid',collections.lists[collections.now].lid);
            proxy.axios({
                method: 'POST',
                url: `${proxy.apiUrl}/music/deleteCollect`,
                headers: {'Authorization': localStorage.getItem('token')},
                data: infos
            }).then((rs)=>{
                if(!(rs.data.status==200)){return toast(-200,rs.data.msg);}
                getListMusics(true,collections.now||0,collections.lists[collections.now||0].lid);
                ipc('collect:re:music');
            });
            return;
        }
        tips.delete.isShow=true;
        tips.delete.rid=rid;
    }
    const createList=(name,across)=>{
        if(across){
            proxy.axios({
                method: 'GET',
                url: `${proxy.apiUrl}/music/createList?name=${name}`,
                headers: {'Authorization': localStorage.getItem('token')}
            }).then((rs)=>{
                if(!(rs.data.status==200)){return toast(-200,rs.data.msg);}
                getlists(false);
            });
            return;
        }
        tips.createList.isShow=true;
        tips.createList.name=name;
    }
    ipcRenderer.on('collect:refresh',()=>{
        getListMusics(true,collections.now||0,collections.lists[collections.now||0].lid);
    });
    // 双击播放
    let count = 0;
    const playCheck=(rid)=>{
        count++;
        setTimeout(() => {
            if(count>=2){
                count=0;
                return play(rid);
            }
            count=0;
        },200);
    }
    // 窗口动画
    let animation = reactive({
        animations: {
            width: 0,
            height: 0
        }
    });
    ipcRenderer.on('collections:restore',()=>{
        animation.animations.height='100%';
    });
    // 关闭窗口并播放动画
    const close=(m)=>{
        animation.animations.height='0';
        setTimeout(()=>{
            if(m==0){
                return ipc('collect:close');
            }
            ipc('collect:minsize');
        },300);
    }
    let selecter=reactive({
        settings: {
            open: false,
            current: 0
        }
    });
    let goTopShow = ref(false);
    const goTop=()=>{
        const music = document.querySelector('.musics');
        let scrollTo = music.scrollTop || document.body.scrollTop
        let myTimer = setInterval(() => {
            scrollTo -= 60
            if(scrollTo<=0){
                scrollTo = 0
                window.clearInterval(myTimer)
                myTimer = -1
            }
            music.scrollTo(0,scrollTo) //这是值  是指离开网页顶部的距离   
        }, 10);
    }
</script>

<template>
    <div class="collect" :style="`width: ${animation.animations.width};height: ${animation.animations.height};`">
        <div class="topbar" :style="`${windowInfo.canRemove?'-webkit-app-region: no-drag;':''}`">
            <div class="musicList icon" @click="selecter.settings.open=true;">
                <div class="show" v-show="collections.lists[selecter.settings.current].name">{{ collections.lists[collections.now||0].name }}</div>
                <div class="hidden-box" v-show="selecter.settings.open">
                    <div class="checkItem" v-show="selecter.settings.open&&collections.lists.length>0" :style="`background: ${collections.now==i?'rgb(50, 235, 30)':''};border-radius: 8px;`" v-for="list,i in collections.lists" @click="getListMusics(false,i,list.lid)"><div class="text">{{ list.name }}</div></div>
                    <div class="checkItem" @click="createList(null,false)" v-show="collections.lists.length<5&&selecter.settings.open" style="justify-content: center;background-color: rgba(100,100,100,0.2);border-radius: 8px;font-weight: bolder;color: rgb(180,180,180);font-size: 20px;padding-top: 0;padding-bottom: 4px;">+</div>
                </div>
            </div>
            <div class="top-item" @click="selecter.settings.open=false;">
                <svg t="1678712496779" @click="getlists();getListMusics()" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2319" width="20" height="20"><path d="M515.1 932C286 932 99.5 745.6 99.5 516.4c0-16.5 13.4-29.9 29.9-29.9s29.9 13.4 29.9 29.9c0 196.2 159.6 355.8 355.8 355.8 118.4 0 228.7-58.6 295-156.9 9.3-13.7 27.9-17.3 41.6-8.1 13.7 9.3 17.3 27.9 8.1 41.6C782.3 863.6 653.4 932 515.1 932zM900.9 546.3c-16.5 0-29.9-13.4-29.9-29.9 0-196.2-159.6-355.8-355.8-355.8-114 0-221.9 55.2-288.7 147.8-9.7 13.4-28.3 16.5-41.8 6.7-13.4-9.7-16.4-28.4-6.7-41.8 78-108 204-172.6 337.1-172.6 229.2 0 415.7 186.5 415.7 415.7 0 16.5-13.4 29.9-29.9 29.9z" p-id="2320"></path><path d="M53 636c-5 0-10.1-1.3-14.7-3.9-14.4-8.2-19.4-26.4-11.3-40.8l69.2-121.9c4.5-7.9 12.4-13.4 21.4-14.8 9-1.5 18.2 1.3 24.9 7.5l108.3 99.2c12.2 11.2 13 30.1 1.8 42.3-11.2 12.2-30.1 13-42.3 1.8l-80.6-73.9L79 620.8c-5.5 9.7-15.6 15.2-26 15.2zM904.4 579.5c-7.4 0-14.6-2.7-20.1-7.8l-104.1-94.6c-12.2-11.1-13.1-30.1-2-42.3 11.1-12.2 30-13.1 42.3-2l76.3 69.3 47.4-84.2c8.1-14.4 26.3-19.6 40.8-11.4 14.4 8.1 19.5 26.4 11.4 40.8l-65.8 116.9c-4.5 8-12.3 13.4-21.3 14.9-1.7 0.3-3.3 0.4-4.9 0.4z" p-id="2321"></path></svg>
                <svg t="1678604493746" @click="ipc('windowInfo:collect:setAlwaysOnTop',false)" v-show="windowInfo.alwaysOnTop" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2291" width="20" height="20"><path d="M480 896V250.4L237.6 493.6 192 448l274.4-274.4L512 128l45.6 45.6L832 448l-45.6 45.6L544 250.4V896h-64z" p-id="2292" fill="rgb(187, 2, 2)"></path></svg>
                <svg t="1678604493746" @click="ipc('windowInfo:collect:setAlwaysOnTop',true)" v-show="!windowInfo.alwaysOnTop" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2291" width="20" height="20"><path d="M480 896V250.4L237.6 493.6 192 448l274.4-274.4L512 128l45.6 45.6L832 448l-45.6 45.6L544 250.4V896h-64z" p-id="2292"></path></svg>
                <svg t="1678511188153" @click="close(1)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3607" width="20" height="20"><path d="M449.92 543.36C449.92 520.96 431.36 512 410.24 512L97.92 512c-17.92 0-32 14.08-32 32 0 17.92 14.08 32 32 32l242.56 0-267.52 267.52c-12.16 12.16-12.16 31.36 0 43.52 12.16 12.16 31.36 12.16 43.52 0l269.44-269.44 0 246.4c0 17.92 14.08 32 32 32 17.92 0 32-14.08 32-32l0-320M865.92 384 622.72 384l267.52-267.52c12.16-12.16 12.16-31.36 0-43.52-12.16-12.16-31.36-12.16-43.52 0L577.92 342.4 577.92 96C577.92 78.08 563.2 64 545.92 64c-17.92 0-32 14.08-32 32l0 320c0 0.64 0.64 1.28 0.64 1.92 0 8.32 2.56 16.64 8.96 22.4C531.2 448.64 542.72 451.2 552.96 448l312.32 0c17.92 0 32-14.08 32-32C897.92 398.08 883.2 384 865.92 384z" p-id="3608"></path></svg>
                <svg t="1678511160839" @click="windowInfo.canRemove=false" v-show="windowInfo.canRemove" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3431" width="20" height="20"><path d="M512 128a224 224 0 0 1 224 224v64h64a64 64 0 0 1 64 64v352a64 64 0 0 1-64 64H224a64 64 0 0 1-64-64V480a64 64 0 0 1 64-64h64v-64a224 224 0 0 1 224-224z m288 704V480H224v352h576z m-259.872-280.928V768h-57.92v-216.928h57.92zM512 192a160 160 0 0 0-159.84 153.056L352 416h320v-64a160 160 0 0 0-153.056-159.84L512 192z" p-id="3432"></path></svg>
                <svg t="1678512389068" @click="windowInfo.canRemove=true" v-show="!windowInfo.canRemove" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3749" width="20" height="20"><path d="M426.666667 565.333333a21.333333 21.333333 0 0 0-21.333334 21.333334v128a21.333333 21.333333 0 0 0 42.666667 0v-128a21.333333 21.333333 0 0 0-21.333333-21.333334zM734.293333 130.346667A192 192 0 0 0 512 320v42.666667a21.333333 21.333333 0 0 0 42.666667 0v-37.12a153.386667 153.386667 0 0 1 129.28-153.6A149.333333 149.333333 0 0 1 853.333333 320v42.666667a21.333333 21.333333 0 0 0 42.666667 0v-36.906667a195.84 195.84 0 0 0-161.706667-195.413333z" p-id="3750"></path><path d="M609.706667 405.333333H243.626667A115.626667 115.626667 0 0 0 128 520.96v259.413333A115.626667 115.626667 0 0 0 243.626667 896h366.08A115.626667 115.626667 0 0 0 725.333333 780.373333V520.96A115.626667 115.626667 0 0 0 609.706667 405.333333zM682.666667 780.373333A72.96 72.96 0 0 1 609.706667 853.333333H243.626667A72.96 72.96 0 0 1 170.666667 780.373333V520.96A72.96 72.96 0 0 1 243.626667 448h366.08A72.96 72.96 0 0 1 682.666667 520.96z" p-id="3751"></path></svg>
                <svg t="1678511091722" @click="close(0)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3255" width="20" height="20"><path d="M557.311759 513.248864l265.280473-263.904314c12.54369-12.480043 12.607338-32.704421 0.127295-45.248112-12.512727-12.576374-32.704421-12.607338-45.248112-0.127295L512.127295 467.904421 249.088241 204.063755c-12.447359-12.480043-32.704421-12.54369-45.248112-0.063647-12.512727 12.480043-12.54369 32.735385-0.063647 45.280796l262.975407 263.775299-265.151458 263.744335c-12.54369 12.480043-12.607338 32.704421-0.127295 45.248112 6.239161 6.271845 14.463432 9.440452 22.687703 9.440452 8.160624 0 16.319527-3.103239 22.560409-9.311437l265.216826-263.807983 265.440452 266.240344c6.239161 6.271845 14.432469 9.407768 22.65674 9.407768 8.191587 0 16.352211-3.135923 22.591372-9.34412 12.512727-12.480043 12.54369-32.704421 0.063647-45.248112L557.311759 513.248864z" p-id="3256"></path></svg>
            </div>
        </div>
        <div class="tip" :style="tips.delete.isShow?'pointer-events: all;':'pointer-events: none;'">
            <div class="message_box" :style="tips.delete.isShow?'top: 0;opacity:1;':'top: -800px;opacity:0;'">
                <div class="header">提示</div>
                <div class="body">
                    <svg t="1678794822275" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2021" width="20" height="20"><path d="M512 85.333333c235.648 0 426.666667 191.018667 426.666667 426.666667s-191.018667 426.666667-426.666667 426.666667S85.333333 747.648 85.333333 512 276.352 85.333333 512 85.333333z m0 170.666667a42.666667 42.666667 0 0 0-42.666667 42.666667v341.333333a42.666667 42.666667 0 0 0 85.333334 0V298.666667a42.666667 42.666667 0 0 0-42.666667-42.666667z m0 554.666667a42.666667 42.666667 0 1 0 0-85.333334 42.666667 42.666667 0 0 0 0 85.333334z" fill="rgba(255,50,50,0.8)" p-id="2022"></path></svg>
                    是否删除该音乐？
                </div>
                <div class="btns">
                    <div class="ln_btn cancel" @click="tips.delete.isShow=false;">取消</div>
                    <div class="ln_btn confirm" @click="tips.delete.isShow=false;deleteMusic(tips.delete.rid,true);">确定</div>
                </div>
            </div>
        </div>
        <div class="tip" :style="tips.createList.isShow?'pointer-events: all;':'pointer-events: none;'">
            <div class="message_box" :style="tips.createList.isShow?'top: 0;opacity:1;':'top: -800px;opacity:0;'">
                <div class="header">新建</div>
                <div class="body" style="flex-direction: column;">
                    <!-- <svg t="1678794822275" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2021" width="20" height="20"><path d="M512 85.333333c235.648 0 426.666667 191.018667 426.666667 426.666667s-191.018667 426.666667-426.666667 426.666667S85.333333 747.648 85.333333 512 276.352 85.333333 512 85.333333z m0 170.666667a42.666667 42.666667 0 0 0-42.666667 42.666667v341.333333a42.666667 42.666667 0 0 0 85.333334 0V298.666667a42.666667 42.666667 0 0 0-42.666667-42.666667z m0 554.666667a42.666667 42.666667 0 1 0 0-85.333334 42.666667 42.666667 0 0 0 0 85.333334z" fill="rgba(255,50,50,0.8)" p-id="2022"></path></svg> -->
                    <!-- 请输入列表名： -->
                    <input type="text" class="ln_input" style="width: 60%;margin-top: 0;" placeholder="请输入列表名" v-model="tips.createList.name">
                </div>
                <div class="btns">
                    <div class="ln_btn cancel" @click="tips.createList.isShow=false;">取消</div>
                    <div class="ln_btn confirm" @click="tips.createList.isShow=false;createList(tips.createList.name,true);">确定</div>
                </div>
            </div>
        </div>
        <div class="musics" @click="selecter.settings.open=false;">
            <div class="music_item" v-for="(music,i) in collections.musics" :key="i" @click="playCheck(music.rid)">
                <div class="music-pic">
                    <img :src="music.pic">
                </div>
                <div class="music-info">
                    <div class="music-name">{{ music.name }}</div>
                    <div class="music-artist">{{ music.author }}</div>
                </div>
                <div class="music-func">
                    <div class="btn">
                        <svg t="1678510926711" @click="play(music.rid)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3113" width="30" height="30"><path d="M512 42.666667C252.793333 42.666667 42.666667 252.793333 42.666667 512s210.126667 469.333333 469.333333 469.333333 469.333333-210.126667 469.333333-469.333333S771.206667 42.666667 512 42.666667z m0 896c-235.64 0-426.666667-191.026667-426.666667-426.666667s191.026667-426.666667 426.666667-426.666667 426.666667 191.026667 426.666667 426.666667-191.026667 426.666667-426.666667 426.666667z m-74.666667-213.38a53.373333 53.373333 0 0 1-53.333333-53.333334V352.066667A53.333333 53.333333 0 0 1 467.373333 308L702 467.933333a53.333333 53.333333 0 0 1 0 88.133334L467.373333 716a53.286667 53.286667 0 0 1-30.04 9.286667z m0.08-383.933334a11.093333 11.093333 0 0 0-5.08 1.28 10.446667 10.446667 0 0 0-5.666666 9.433334v319.866666a10.666667 10.666667 0 0 0 16.666666 8.82l234.666667-159.94a10.666667 10.666667 0 0 0 0-17.626666l-234.666667-159.933334a10.313333 10.313333 0 0 0-5.906666-1.92z" p-id="3114"></path></svg>
                        <svg t="1678712126266" @click="deleteMusic(music.rid,false)" class="icon delete" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2170" width="20" height="20"><path d="M840 288H688v-56c0-40-32-72-72-72h-208C368 160 336 192 336 232V288h-152c-12.8 0-24 11.2-24 24s11.2 24 24 24h656c12.8 0 24-11.2 24-24s-11.2-24-24-24zM384 288v-56c0-12.8 11.2-24 24-24h208c12.8 0 24 11.2 24 24V288H384zM758.4 384c-12.8 0-24 11.2-24 24v363.2c0 24-19.2 44.8-44.8 44.8H332.8c-24 0-44.8-19.2-44.8-44.8V408c0-12.8-11.2-24-24-24s-24 11.2-24 24v363.2c0 51.2 41.6 92.8 92.8 92.8h358.4c51.2 0 92.8-41.6 92.8-92.8V408c-1.6-12.8-12.8-24-25.6-24z" p-id="2171"></path><path d="M444.8 744v-336c0-12.8-11.2-24-24-24s-24 11.2-24 24v336c0 12.8 11.2 24 24 24s24-11.2 24-24zM627.2 744v-336c0-12.8-11.2-24-24-24s-24 11.2-24 24v336c0 12.8 11.2 24 24 24s24-11.2 24-24z" p-id="2172"></path></svg>
                    </div>
                </div>
            </div>
            <span v-show="collections.musics.length>0" style="text-align: center;display: block;color: rgba(110,110,110,0.4);margin: 5px 20px 20px 20px;">没有啦~</span>
            <span v-show="collections.musics.length<=0" style="text-align: center;display: block;color: rgba(110,110,110,0.4);position: fixed;top: 50%;left: 50%;transform: translate(-50%,-50%);">没有收藏呢~</span>
        </div>
        <div class="goTop" :style="`opacity: ${goTopShow?'1':'0'}`" @click="goTop()"><svg t="1680318327263" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2573" width="80" height="80"><path d="M866.7 96H157.3c-17.8 0-32.2 14.4-32.2 32.2 0 17.8 14.4 32.2 32.2 32.2h709.5c17.8 0 32.2-14.4 32.2-32.2 0-17.8-14.4-32.2-32.3-32.2zM512 225c-16.5 0-33 6.3-45.6 18.9L169.9 540.3c-5.8 5.8-9.4 13.9-9.4 22.8s3.6 17 9.4 22.8c5.8 5.8 13.9 9.4 22.8 9.4s17-3.6 22.8-9.4l264.2-264.2v574c0 17.8 14.4 32.2 32.2 32.2 17.8 0 32.2-14.4 32.2-32.2v-574l264.2 264.2c5.8 5.8 13.9 9.4 22.8 9.4s17-3.6 22.8-9.4c5.8-5.8 9.4-13.9 9.4-22.8s-3.6-17-9.4-22.8L557.6 243.9C545 231.3 528.5 225 512 225z" fill="#1296db" p-id="2574"></path></svg></div>
    </div>
</template>

<style scoped>
    .goTop{
        position: fixed;
        bottom: 80px;
        right: 10px;
        width: 35px;
        height: 35px;
        background-color: #fff;
        border-radius: 50%;
        padding: 2px;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: .5s;
    }
    .goTop:hover{
        background-color: rgb(209, 209, 209);
    }
    .musicList{
        background-color: rgba(0, 0, 0, 0.4);
        /* max-height: 40px; */
        width: 100px;
        border-radius: 12px;
        color: #fff;
        font-size: 14px;
        overflow: hidden;
        margin-right: 8px;
        display: flex;
        /* align-items: center; */
        position: fixed;
        left: 20px;
        top: 3px;
        z-index: 1000;
        -webkit-app-region: no-drag;
        flex-direction: column;
        box-sizing: border-box;
    }
    .checkItem{
        display: flex;
        text-overflow: ellipsis;
        overflow: hidden;
        pointer-events: all;
        padding: 6px 4px;
        text-align: center;
        /* justify-content: center; */
        align-items: center;
        margin-top: 4px;
        max-height: 30px;
        white-space: nowrap;
        text-align: left;
        width: 100%;
        box-sizing: border-box;
    }
    .checkItem .text{
        text-overflow: ellipsis;
        overflow: hidden;
    }
    .hidden-box{
        display: flex;
        text-overflow: ellipsis;
        overflow: hidden;
        flex-direction: column;
        pointer-events: all;
        /* padding: 0px 8px; */
        box-sizing: border-box;
        width: 100%;
    }
    .hidden-box .checkItem:hover{
        background-color: rgb(141, 148, 140);
        border-radius: 8px;
    }
    .show{
        display: block;
        text-overflow: ellipsis;
        overflow: hidden;
        /* padding:2px 12px; */
        white-space: nowrap;
        text-align: center;
    }
    .collect{
        background-color: #1a1a1a3a;
        border-radius: 8px;
        position: absolute;
        /* width: 100%;
        height: 100%; */
        width: 0;
        height: 0;
        top: 0;
        left: 0;
        padding-top: 40px;
        box-sizing: border-box;
        border-radius: 8px;
        transition: .3s;
    }
    .topbar{
        /* background-color: rgb(2, 187, 79); */
        background-image: linear-gradient(90deg,rgb(18, 249, 114),rgb(3, 190, 81),rgb(2, 187, 79));
        border-radius: 8px 8px 0 0;
    }
    .musics{
        overflow: scroll;
        height: 100%;
        transition: .3s;
    }
    .music-pic{flex-shrink: 0;}
    .music-pic:hover{
        box-shadow: 0px 0px 5px rgba(3, 255, 36, 0.5);
        cursor: pointer;
    }
    .btn{flex-shrink: 0;}
    .music-name{word-break: break-all;}
</style>