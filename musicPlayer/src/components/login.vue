<script setup>
    import { reactive,ref,getCurrentInstance,onMounted } from 'vue';
    const { ipcRenderer } = require('electron');
    const { proxy } = getCurrentInstance();
    const ipc=(n,v=null,toString=false)=>{
        if(toString){v=JSON.stringify(v);}
        ipcRenderer.send(n,v);
    };
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
    const windowInfo = reactive({
        signInUI: false,
        goSign: false,
        width: '0%',
        height: '0%'
    });
    let loginInfo = reactive({
        username: '',
        password: ''
    });
    let signInfo = reactive({
        username: '',
        password: '',
        code: '',
        isSend: false
    });
    onMounted(()=>{
        setTimeout(() => {
            windowInfo.width= '100%';
            windowInfo.height= '100%';
        }, 10);
        const token = localStorage.getItem('token');
        if(token!=null){
            proxy.axios({
                method: 'GET',
                url: `${proxy.apiUrl}/user/getUserInfo`,
                headers: {'Authorization': token}
            }).then((res)=>{
                if(!(res.data.status==200)) return;
                setTimeout(() => {
                    windowInfo.width= '0%';
                    windowInfo.height= '0%';
                }, 12);
                ipc('music:show');
                setTimeout(()=>{ipc('login:hide');},40);
                setTimeout(()=>{
                    ipc('login:close');
                },2000);
            });
        }
    });
    const logIn=(info=loginInfo)=>{
        if(info.username.length<2||info.password.length<6){return;}
        const infos = new URLSearchParams();
        infos.append('username',info.username);
        infos.append('password',info.password);
        proxy.axios({
            method: 'POST',
            url: `${proxy.apiUrl}/api/login`,
            data: infos
        }).then((response)=>{
            if(!response.data.status){return;}
            switch (response.data.status) {
                case 200: toast(200,`登录成功~`);
                            localStorage.setItem('token',response.data.data.token);
                            windowInfo.width='0%';windowInfo.height='0%';
                            ipc('music:show');
                            setTimeout(()=>{ipc('login:hide');},40);
                            setTimeout(()=>{ipc('login:close');},2000);
                        break;
                case 400: toast(-200,`该账号暂未注册`);windowInfo.goSign=true;break;
                case 300: toast(-200,`${response.data.msg}`);break;
                default: toast(400,`未知错误[code: -${response.data.status}]`);break;
            }
        });
    }
    // 注册
    const signIn=()=>{
        if(!signInfo.username||!signInfo.password){return;}
        if(signInfo.code!=code.value){return toast(-200,'验证码有误');}
        if(signInfo.password.length<6){return toast(300,'密码太短');}
        if(!signInfo.code){return toast(300,'请填写验证码');}
        const infos = new URLSearchParams();
        infos.append('mail',signInfo.username);
        infos.append('password',signInfo.password);
        proxy.axios({
            method: 'POST',
            url: `${proxy.apiUrl}/api/register`,
            data: infos
        }).then((response)=>{
            if(!(response.data||response.data.status)){return toast(-200,'请求失败');}
            if(!(response.data.status==200)){return toast(response.data.status||-200,response.data.msg||'未知');}
            toast(200,'注册成功~');
            windowInfo.signInUI=false;
            loginInfo.username=signInfo.username;
            loginInfo.password='';
            signInfo.password='';
            signInfo.code='';
        });
    }
    // 验证码
    let code = ref(0);
    const sendCode=()=>{
        if(!/^([a-zA-Z]|[0-9])(\w|\-)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,4})$/.test(signInfo.username)){return toast(300,'邮箱格式不正确');}
        code.value=parseInt(String(Math.floor(Math.random() * 1000000)).padEnd(6, '0')); //生成随机验证码
        let _temp = Math.round(Math.random()*100);
        let _code = 0;
        if(_temp>=50){_code = code.value-_temp;}else{_code = code.value+_temp;}
        console.log('真实数据：',code.value,'加密数据：',_code);
        proxy.axios({
            method: 'GET',
            url: `${proxy.apiUrl}/tools/sendCode?to=${signInfo.username}&code=${_code}&type=${_temp}`
        }).then((response)=>{
            if(!(response.data.status==200)){signInfo.isSend=false;toast(-200,'发送失败');return;}
            signInfo.isSend=true;
            toast(200,'发送成功');
        });
        setTimeout(()=>{
            signInfo.code='';
            signInfo.isSend=false;
        },60000);
    }
    const close=(m)=>{
        windowInfo.width= '0%';
        windowInfo.height= '0%';
        setTimeout(() => {
            if(m==0){
                return ipc('login:close');
            }
            ipc('login:minsize');
        },200);
    }
    ipcRenderer.on('login:restore',()=>{
        windowInfo.width= '100%';
        windowInfo.height= '100%';
    });
</script>

<template>
  <div class="login" :style="`width: ${windowInfo.width};height: ${windowInfo.height};`">
    {{ $api }}
    <div class="topbar" :style="`width: ${windowInfo.width};`">
        <div class="top-item">
            <svg t="1679310787709" @click="windowInfo.signInUI=!windowInfo.signInUI" class="icon" viewBox="0 0 1109 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9890" width="20" height="20"><path d="M1028.4302876 848.07974638a31.79867519 31.79867519 0 0 1-21.56160146 8.96212706h-81.10912062v75.7093456c-0.03749854 16.0868294-14.06191377 29.2112833-31.27369745 29.24878096h-0.03749854c-17.21178281-0.03749854-31.23619893-13.16195156-31.23619805-29.24878096v-75.7093456h-80.88413026a32.43614854 32.43614854 0 0 1-22.12407774-8.54964404 28.38631729 28.38631729 0 0 1-9.14961885-20.69913779c0-16.12432792 14.02441523-29.24878096 31.23619805-29.24878096h80.9216288v-75.70934561c0-16.12432792 14.02441523-29.24878096 31.23619805-29.24878184 17.24928135 0 31.31119512 13.12445303 31.31119599 29.24878184v75.70934561h80.62164054c16.98679248 0.48748008 30.44873144 13.08695449 30.78621738 28.64880615a27.93633574 27.93633574 0 0 1-8.73713584 20.88662958z m-211.94116963-218.6158913a32.2861544 32.2861544 0 0 1-21.56160146-8.02466543l-1.57493409-1.27494668a431.94450323 431.94450323 0 0 0-251.05203984-79.27169766c-230.01541612 0-417.17011904 175.11770391-417.17011904 390.39623438-0.07499708 16.199325-14.17440937 29.32377802-31.46118927 29.32377802-17.28677988 0-31.42369073-13.16195156-31.46118925-29.39877509 0.03749854-92.65863955 30.03624844-181.52993672 86.65888975-257.05178965 55.38519229-73.79692558 132.03199863-129.81959122 221.76575947-162.03074941l28.76130175-10.34956846-23.39902441-18.78671778c-56.84763164-45.63559863-89.47127197-111.82034092-89.47127285-181.6049329C286.52369873 169.39552344 401.26891836 62.03749678 542.30054258 62.03749678c141.06912276 0 255.81434151 107.35802666 255.8143415 239.35252763 0 69.78459199-32.62364033 135.96933516-89.50877139 181.60493291l-23.39902441 18.82421631 28.79879941 10.31206992c40.12332802 14.36190205 78.2967375 33.97358408 113.50777149 58.27257247l8.54964316 6.56222607a28.68630469 28.68630469 0 0 1 11.88700488 23.06153935c0 16.199325-14.0994123 29.3987751-31.46118925 29.43627364z m-81.2966124-328.07383066c0-99.52085391-86.54639414-180.47998037-192.89196299-180.47998038-106.30807031 0-192.85446445 80.95912646-192.85446534 180.47998038s86.54639414 180.44248184 192.85446534 180.44248183c106.34556885 0 192.89196299-80.92162881 192.89196299-180.44248183z" p-id="9891" :fill="!windowInfo.signInUI?'#fff':'rgb(2,187,79)'"></path></svg>
            <svg t="1678511188153" @click="close(1)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3607" width="20" height="20"><path d="M449.92 543.36C449.92 520.96 431.36 512 410.24 512L97.92 512c-17.92 0-32 14.08-32 32 0 17.92 14.08 32 32 32l242.56 0-267.52 267.52c-12.16 12.16-12.16 31.36 0 43.52 12.16 12.16 31.36 12.16 43.52 0l269.44-269.44 0 246.4c0 17.92 14.08 32 32 32 17.92 0 32-14.08 32-32l0-320M865.92 384 622.72 384l267.52-267.52c12.16-12.16 12.16-31.36 0-43.52-12.16-12.16-31.36-12.16-43.52 0L577.92 342.4 577.92 96C577.92 78.08 563.2 64 545.92 64c-17.92 0-32 14.08-32 32l0 320c0 0.64 0.64 1.28 0.64 1.92 0 8.32 2.56 16.64 8.96 22.4C531.2 448.64 542.72 451.2 552.96 448l312.32 0c17.92 0 32-14.08 32-32C897.92 398.08 883.2 384 865.92 384z" p-id="3608"></path></svg>
            <svg t="1678511091722" @click="close(0)" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3255" width="20" height="20"><path d="M557.311759 513.248864l265.280473-263.904314c12.54369-12.480043 12.607338-32.704421 0.127295-45.248112-12.512727-12.576374-32.704421-12.607338-45.248112-0.127295L512.127295 467.904421 249.088241 204.063755c-12.447359-12.480043-32.704421-12.54369-45.248112-0.063647-12.512727 12.480043-12.54369 32.735385-0.063647 45.280796l262.975407 263.775299-265.151458 263.744335c-12.54369 12.480043-12.607338 32.704421-0.127295 45.248112 6.239161 6.271845 14.463432 9.440452 22.687703 9.440452 8.160624 0 16.319527-3.103239 22.560409-9.311437l265.216826-263.807983 265.440452 266.240344c6.239161 6.271845 14.432469 9.407768 22.65674 9.407768 8.191587 0 16.352211-3.135923 22.591372-9.34412 12.512727-12.480043 12.54369-32.704421 0.063647-45.248112L557.311759 513.248864z" fill="#fff" p-id="3256"></path></svg>
        </div>
    </div>
    <div class="login_box" v-show="!windowInfo.signInUI">
        <input type="text" placeholder="用户名/密码" v-model="loginInfo.username" :class="`username ${loginInfo.username.length>0?'isFill':''}`">
        <input type="password" placeholder="密码" @keyup.enter="logIn()" v-model="loginInfo.password" :class="`password ${loginInfo.password.length>0?'isFill':''}`">
        <input type="button" :class="`submit ${loginInfo.username.length>=2&&loginInfo.password.length>=6?'isFillSub':''}`" value="登录" @click="logIn()">
    </div>
    <div class="signin_box" v-show="windowInfo.signInUI">
        <input type="text" placeholder="请填写您的邮箱" v-model="signInfo.username" :class="`username ${signInfo.username.length>0?'isFill':''}`">
        <div class="box">
            <input type="password" placeholder="请输入密码" @keyup.enter="signIn()" v-model="signInfo.password" :class="`password ${signInfo.password.length>0?'isFill':''}`">
            <input type="text" v-show="signInfo.isSend" placeholder="验证码" v-model="signInfo.code" :class="`code ${signInfo.code.length>0?'isFill':''}`">
            <input type="button" v-show="!signInfo.isSend" @click="sendCode()" class="code" value="发送验证码" style="font-size: 10px;cursor: pointer;">
        </div>
        <input type="button" :class="`submit ${signInfo.username.length>=2&&signInfo.password.length>=6&&signInfo.code.length>=4?'isFillSub':''}`" value="注册" @click="signIn()">
    </div>
  </div>
</template>

<style scoped>
    .login{
        position: absolute;
        /* width: 300px; */
        /* height: 250px; */
        width: 0%;
        height: 0%;
        background-color: #1a1a1a3a;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        transition: .3s;
    }
    .login_box,.signin_box{
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        padding-top: 16px;
    }
    .login_box input::placeholder,.signin_box input::placeholder{
        color: rgb(217, 212, 212);
    }
    .login_box input,.signin_box input{
        padding: 8px;
        margin: 8px;
        border-radius: 8px;
        border: 1px solid rgba(244, 244, 244, 0.772);
        outline: none;
        background-color: rgba(69, 69, 69, 0.1);
        color: #fff;
        width: 80%;
        box-sizing: content-box;
    }
    .login_box input:hover,.signin_box input:hover{
        border-color: rgb(2, 187, 79);
        color: rgb(2, 187, 79);
    }
    .login_box input.isFill,.signin_box input.isFill{
        border-color: rgb(2, 187, 79);
        background: rgba(255, 255, 255, 0.9);
        color: #000;
    }
    .login_box input.submit,.signin_box input.submit{
        cursor: pointer;
    }
    .signin_box{
        width: 70%;
        transition: .3s;
    }
    .signin_box .box{
        display: flex;
        align-items: center;
    }
    .signin_box input.code{
        max-width: 50px;
        margin-left: 0;
        margin-right: 12px;
        text-align: center;
    }
    .signin_box input.password{
        margin-left: 12px;
    }
    .isFillSub{
        background-color: rgb(2,187,97)!important;
    }
    .isFillSub:hover{
        color: #000!important;
    }
    .topbar{
        transition: .3s;
    }
</style>