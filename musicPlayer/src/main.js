import { createApp } from 'vue'
import './style.css'
import axios from 'axios';
import music from './components/music.vue'
import collect from './components/Collect.vue'
import login from './components/login.vue'
import userCenter from './components/userCenter.vue'
const apiUrl = 'http://127.0.0.1:3000';
const apps = {
    musics: createApp(music),
    collects: createApp(collect),
    logins: createApp(login),
    userCenters: createApp(userCenter)
}
for(let i in apps){
    apps[i].config.globalProperties.axios=axios;
    apps[i].config.globalProperties.apiUrl=apiUrl;
}
apps.musics.mount('#app');
apps.collects.mount('#collect');
apps.logins.mount('#login');
apps.userCenters.mount('#userCenter');
