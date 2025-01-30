<script setup>
    import { reactive,onMounted,getCurrentInstance } from 'vue';
    const {ipcRenderer} = require('electron');
    const {proxy} = getCurrentInstance();
    const ipc=(n,v=null,toString=false)=>{
        if(toString){v=JSON.stringify(v);}
        ipcRenderer.send(n,v);
    };
    const userInfo = reactive({
        info: {}
    });
    const getUserInfo=()=>{
        proxy.axios({
            method: 'GET',
            url: `${proxy.apiUrl}/user/getUserInfo`,
            headers: {'Authorization': localStorage.getItem('token')}
        }).then(res=>{
            if(res.data.status&&res.data.status==200){
                userInfo.info=res.data.data;
                return;
            }
            toast(res.data.status||-200,res.data.msg||'ERROR');
        });
    }
    onMounted(()=>{
        const token = localStorage.getItem('token')||undefined;
        if(!token){
            animation.animations.width='0%';
            animation.animations.height='0%';
            animation.animations.opacity='0';
            setTimeout(() => {
                ipc('userCenter:close');
            }, 20);
            return;
        }
        getUserInfo();
        setTimeout(() => {
            animation.animations.width='100%';
            animation.animations.height='100%';
            animation.animations.opacity='1';
        }, 200);
    });
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
    // 窗口动画
    let animation = reactive({
        animations: {
            width: 0,
            height: 0,
            opacity: 0
        }
    });
    // 关闭+动画
    const close=(m)=>{
        animation.animations.width='0';
        animation.animations.height='0';
        animation.animations.opacity='0';
        setTimeout(() => {
            if(m==0){
                ipc('userCenter:close');
            }else{
                ipc('userCenter:minisize');
            }
        }, 200);
    }
    ipcRenderer.on('userCenter:restore',()=>{
        setTimeout(() => {
            animation.animations.width='100%';
            animation.animations.height='100%';
            animation.animations.opacity='1';
        }, 200);
    });
</script>

<template>
    <div class="userCenter" :style="`background-image: url(${userInfo.info.img});width: ${animation.animations.width};height: ${animation.animations.height};`">
        <div class="userCenter_mask"></div>
        <div class="topbar samllbar">
            <div class="top-item">
                <svg t="1678511188153" @click="close(1)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3607" width="20" height="20"><path d="M449.92 543.36C449.92 520.96 431.36 512 410.24 512L97.92 512c-17.92 0-32 14.08-32 32 0 17.92 14.08 32 32 32l242.56 0-267.52 267.52c-12.16 12.16-12.16 31.36 0 43.52 12.16 12.16 31.36 12.16 43.52 0l269.44-269.44 0 246.4c0 17.92 14.08 32 32 32 17.92 0 32-14.08 32-32l0-320M865.92 384 622.72 384l267.52-267.52c12.16-12.16 12.16-31.36 0-43.52-12.16-12.16-31.36-12.16-43.52 0L577.92 342.4 577.92 96C577.92 78.08 563.2 64 545.92 64c-17.92 0-32 14.08-32 32l0 320c0 0.64 0.64 1.28 0.64 1.92 0 8.32 2.56 16.64 8.96 22.4C531.2 448.64 542.72 451.2 552.96 448l312.32 0c17.92 0 32-14.08 32-32C897.92 398.08 883.2 384 865.92 384z" p-id="3608"></path></svg>
                <svg t="1678511091722" @click="close(0)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3255" width="20" height="20"><path d="M557.311759 513.248864l265.280473-263.904314c12.54369-12.480043 12.607338-32.704421 0.127295-45.248112-12.512727-12.576374-32.704421-12.607338-45.248112-0.127295L512.127295 467.904421 249.088241 204.063755c-12.447359-12.480043-32.704421-12.54369-45.248112-0.063647-12.512727 12.480043-12.54369 32.735385-0.063647 45.280796l262.975407 263.775299-265.151458 263.744335c-12.54369 12.480043-12.607338 32.704421-0.127295 45.248112 6.239161 6.271845 14.463432 9.440452 22.687703 9.440452 8.160624 0 16.319527-3.103239 22.560409-9.311437l265.216826-263.807983 265.440452 266.240344c6.239161 6.271845 14.432469 9.407768 22.65674 9.407768 8.191587 0 16.352211-3.135923 22.591372-9.34412 12.512727-12.480043 12.54369-32.704421 0.063647-45.248112L557.311759 513.248864z" p-id="3256"></path></svg>
            </div>
        </div>
        <div class="card" :style="`opacity: ${animation.animations.opacity};`">
            <div class="mine">
                <div class="face">
                    <img class="face-img" :src="userInfo.info.img">
                    <div :class="`sex ${userInfo.info.sex==0?'male':userInfo.info.sex==1?'female':'asexual'}`"><img width="16" :src="`/src/assets/fans/${userInfo.info.sex==0?'male':userInfo.info.sex==1?'female':'asexual'}.png`"></div>
                </div>
                <div class="info">
                    <div :class="`name ${userInfo.info.username?'':'noContent'}`">{{ userInfo.info.username||'点我设置' }}</div>
                    <div class="mail">{{ userInfo.info.mail||'' }}</div>
                </div>
            </div>
            <div class="sign" style="margin-top: 10px;">{{ userInfo.info.sign }}</div>
            <div class="infos">
                <div class="info_item">
                    <div class="info_na">收藏</div>
                    <div class="info_valut">{{ userInfo.info.collects||0 }}</div>
                </div>
                <div class="info_item">
                    <div class="info_na">播放</div>
                    <div class="info_valut">{{ userInfo.info.plays||0 }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .infos{
        display: flex;
        align-items: center;
        width: 100%;
        justify-content: center;
        /* background-color: #000; */
    }
    .info_item{
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 12px;
    }
    .info_item .info_na{
        color: rgb(228, 228, 228);
        font-size: 16px;
    }
    .info_item .info_valut{
        color: rgb(2, 187, 79);
        font-size: 25px;
    }
    .card {
        display: flex;
        opacity: 0;
        width: 100%;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: rgb(255, 255, 255);
        transition: all .3s;
    }
    .card .name{
        /* padding: 8px; */
        font-size: 22px;
    }
    .card .face{
        position: relative;
    }
    .card .face .face-img{
        width: 60px;
        height: 60px;
        border-radius: 50%;
    }
    .card .face .sex{
        width: 16px;
        height: 16px;
        padding: 4px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        bottom: 0;
        right: 0;
    }
    .card .face .male{
        background-color: rgb(3, 129, 255);
    }
    .card .face .female{
        background-color: rgb(236, 46, 135);
    }
    .card .face .asexual{
        background-color: rgb(71, 71, 71);
    }
    #app {
        width: 100%;
        height: 100%;
    }
    .mine{
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .info{
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding-left: 12px;
    }
    .info .mail{
        color: rgb(110, 110, 110);
        font-size: 14px;
    }
    .mine .fans{
        font-weight: bolder;
        font-size: 28px;
        padding: 24px;
    }
    .userCenter{
        background-color: #1a1a1a3a;
        border-radius: 8px;
        /* position: absolute; */
        width: 0;
        height: 0;
        top: 0;
        left: 0;
        padding-top: 40px;
        box-sizing: border-box;
        border-radius: 8px;
        -webkit-app-region: drag;
        background-repeat: no-repeat;
        background-size: cover;
        z-index: -2;
        /* filter: blur(2.5px); */
        transition: .3s;
    }
    .userCenter_mask{
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(47, 47, 47, 0.421);
        top: 0;
        left: 0;
        border-radius: 8px;
        z-index: -1;
        backdrop-filter: blur(5px);
    }
    .noContent{
        color: rgb(68, 255, 55);
    }
</style>