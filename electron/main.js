const serverUrl = "http://127.0.0.1:8991";
const { app, BrowserWindow,ipcMain,Notification,screen } = require('electron');
const download = require('./utils/download');
const getWindowInfoMusic=()=>{
  return {alwaysOnTop: win.isAlwaysOnTop()};
}
const getWindowInfoCollect=()=>{
  return {alwaysOnTop: collections.isAlwaysOnTop()};
}
// -----------------------------窗口-----------------------------
let win;
let size;
const remote = require('@electron/remote/main');
remote.initialize();
const createWindow=async (url)=>{
  win = new BrowserWindow({
    id: 'music',
    width: 360,
    height: 100,
    icon: `${serverUrl}/src/assets/fav.png`, //窗口图标
    frame: false,                 //无边框窗口
    transparent: true,            //透明窗口
    resizable: false,             //禁止调整窗口大小
    alwaysOnTop: true,            //窗口永远在最顶部
    skipTaskbar: false,           //任务栏显示
    webPreferences: {             //网页功能设置
      nodeIntegration: true,      //在main.js内是否能使用node的模块
      contextIsolation: false,    //关闭后，可在渲染进程中使用electron的api
    }
  });
  //窗口菜单栏设置
  // win.setMenu(null);
  //加载html文件
  win.loadURL(serverUrl+url);
  //窗口定位
  const winBounds = win.getBounds();
  const whichScreen = screen.getDisplayNearestPoint({x: winBounds.x, y: winBounds.y});
  win.setPosition(whichScreen.size.width-440-10,10);
  size = win.getSize();
  win.on('restore',()=>{win.webContents.send('music:restore');});
  remote.enable(win.webContents);
};
let toast;
const createToast=(content,color='#fff')=>{
  toast = new BrowserWindow({
    width: 200,
    height: 80,
    icon: `${serverUrl}/src/assets/fav.png`, //窗口图标
    frame: false,                 //无边框窗口
    transparent: true,            //透明窗口
    center: true,                 //居中显示
    resizable: false,             //禁止调整窗口大小
    alwaysOnTop: true,            //窗口永远在最顶部
    skipTaskbar: true,            //任务栏显示
    webPreferences: {             //网页功能设置
      nodeIntegration: true,      //在main.js内是否能使用node的模块
      contextIsolation: false,    //关闭后，可在渲染进程中使用electron的api
    }
  });
  toast.loadURL(serverUrl+`/views/toast/index.html?content=${content}&color=${color}`);
}
let collections;
const createCollections=()=>{
  collections = new BrowserWindow({
    id: 'collect',
    width: 320,                   //窗口宽度
    height: 550,                  //窗口高度
    icon: `${serverUrl}/src/assets/fav.png`, //窗口图标
    frame: false,                 //无边框窗口
    transparent: true,            //透明窗口
    center: true,                 //居中显示
    resizable: false,             //禁止调整窗口大小
    alwaysOnTop: false,           //窗口永远在最顶部
    skipTaskbar: false,           //任务栏显示
    webPreferences: {             //网页功能设置
      nodeIntegration: true,      //在main.js内是否能使用node的模块
      contextIsolation: false,    //关闭后，可在渲染进程中使用electron的api
    }
  });
  collections.loadURL(serverUrl+`/views/collect/index.html`);
  collections.on('restore',()=>{
    collections.webContents.send('collections:restore');
  });
}
let login;
const createLogin=()=>{
  login = new BrowserWindow({
    id: 'loginWindow',
    width: 300,                   //窗口宽度
    height: 250,                  //窗口高度
    icon: `${serverUrl}/src/assets/fav.png`, //窗口图标
    frame: false,                 //无边框窗口
    transparent: true,            //透明窗口
    center: true,                 //居中显示
    resizable: false,             //禁止调整窗口大小
    alwaysOnTop: true,           //窗口永远在最顶部
    skipTaskbar: false,           //任务栏显示
    webPreferences: {             //网页功能设置
      nodeIntegration: true,      //在main.js内是否能使用node的模块
      contextIsolation: false,    //关闭后，可在渲染进程中使用electron的api
    }
  });
  login.loadURL(serverUrl+`/views/login/index.html`);
  login.on('restore',()=>{
    login.webContents.send('login:restore');
  });
}
let userCenter;
const createUserCenter=()=>{
  userCenter = new BrowserWindow({
    id: 'userCenterWindow',
    width: 300,                   //窗口宽度
    height: 250,                  //窗口高度
    icon: `${serverUrl}/src/assets/fav.png`, //窗口图标
    frame: false,                 //无边框窗口
    transparent: true,            //透明窗口
    center: true,                 //居中显示
    resizable: false,             //禁止调整窗口大小
    alwaysOnTop: true,           //窗口永远在最顶部
    skipTaskbar: false,           //任务栏显示
    webPreferences: {             //网页功能设置
      nodeIntegration: true,      //在main.js内是否能使用node的模块
      contextIsolation: false,    //关闭后，可在渲染进程中使用electron的api
    }
  });
  userCenter.loadURL(serverUrl+`/views/userCenter/index.html`);
  userCenter.on('restore',()=>{
    userCenter.webContents.send('userCenter:restore');
  });
}
app.whenReady().then(() => {
  createLogin();
  //win右下角弹窗
  new Notification({title: '欢迎进入2kの小软件',body: '你好呀~',silent: false,icon: `${serverUrl}/src/assets/fav.png`}).show();
  // app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0){createWindow()}});
});
// ------------------------------------------音乐条相关------------------------------------------
ipcMain.on('music:close',()=>{
  if(win) win.close();win=null;
  if(toast) toast.hide();
  if(collections) collections.close();collections=null;
  if(userCenter) userCenter.close();userCenter=null;
  if(!login){app.quit()}
});
ipcMain.on('music:minsize',()=>{
  win.minimize();
});
ipcMain.on('music:hide',()=>{
  win.hide();
});
ipcMain.on('music:show',()=>{
  if(win) return win.show();
  createWindow('/views/index/index.html');
});
ipcMain.on('windowInfo:music:get',async ()=>{
  win.webContents.send('windowInfo:music:result',getWindowInfoMusic());
});
ipcMain.on('windowInfo:music:setAlwaysOnTop',async (e,onTop)=>{
  win.setAlwaysOnTop(onTop);
  win.webContents.send('windowInfo:music:result',getWindowInfoMusic());
});
ipcMain.on('music:collect',async ()=>{
  if(collections) collections.webContents.send('collect:refresh');
});
ipcMain.on('collections:open',async ()=>{
  if(collections){return collections.show();}
  createCollections();
});
ipcMain.on('music:searchUI:open',async ()=>{
  win.setResizable(true);
  win.setSize(size[0], size[1]+400);
  win.setResizable(false);
});
ipcMain.on('music:searchUI:close',async ()=>{
  win.setResizable(true);
  await win.setSize(size[0], size[1]);
  win.setResizable(false);
});
ipcMain.on('music:download',async (e,info)=>{
  const {url,fileName} = JSON.parse(info);
  if(!url||!fileName||url==null||fileName==null){return win.webContents.send('download:result',{status: -200,msg: '下载失败'});}
  let rs = await download(url,fileName,'./download');
  win.webContents.send('download:result',rs);
});
// ------------------------------------------弹窗相关------------------------------------------
ipcMain.on('toast:show',async (e,info)=>{
  if(!toast) createToast(info.content||info,info.color||'#fff');
  toast.show();
});
ipcMain.on('toast:hide',async ()=>{
  if(toast) toast.hide();
  toast=null;
});
// ------------------------------------------收藏相关------------------------------------------
ipcMain.on('collect:close',async ()=>{
  collections.close();
  collections=null;
  if(!((!win&&login)||(!login&&win))){app.quit()}
});
ipcMain.on('collect:minsize',()=>{
  if(collections) collections.minimize();
});
ipcMain.on('windowInfo:collect:get',async ()=>{
  collections.webContents.send('windowInfo:collect:result',getWindowInfoCollect());
});
ipcMain.on('windowInfo:collect:setAlwaysOnTop',async (e,onTop)=>{
  collections.setAlwaysOnTop(onTop);
  collections.webContents.send('windowInfo:collect:result',getWindowInfoCollect());
});
ipcMain.on('collect:play',async (e,info)=>{
  win.webContents.send('music:play',info);
});
ipcMain.on('collect:re:music',async ()=>{
  if(win) win.webContents.send('music:refresh');
});
// ------------------------------------------登录注册相关------------------------------------------
ipcMain.on('login:show',async ()=>{
  if(win) win.close();win=null;
  if(collections) collections.close();collections=null;
  if(userCenter) userCenter.close();userCenter=null;
  if(login) return login.show();
  if(toast) toast.close();toast=null;
  createLogin();
});
ipcMain.on('login:close',async ()=>{
  if(login) login.close();login=null;
  if(!win){app.quit()}
});
ipcMain.on('login:hide',async ()=>{
  if(login) return login.hide();
});
ipcMain.on('login:minsize',async ()=>{
  if(login) return login.minimize();
});
// ------------------------------------------用户中心相关------------------------------------------
ipcMain.on('userCenter:open',async ()=>{
  if(userCenter){userCenter.close();userCenter=null;createUserCenter();return;}
  createUserCenter();
});
ipcMain.on('userCenter:close',async ()=>{
  if(userCenter){userCenter.close();userCenter=null;}
  if(!((!win&&login)||(!login&&win))){app.quit()}
});
ipcMain.on('userCenter:minisize',async ()=>{
  if(userCenter){userCenter.minimize();}
});