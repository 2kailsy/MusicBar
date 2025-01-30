<script setup>
    import {reactive} from 'vue';
    let tic = reactive([
        [0,0,0],
        [0,0,0],
        [0,0,0],
    ]);
    let win = [[{x:0,y:0},{x:1,y:1},{x:2,y:2}],[{x:2,y:0},{x:1,y:1},{x:0,y:2}]];
    for(let x=0;x<3;x++){
        let _h = [];
        let _z = [];
        for(let y=0;y<3;y++){
            _h.push({x:x,y:y});
            _z.push({x:y,y:x});
        }
        win.push(_h);
        win.push(_z);
    }
    let flag = true;
    let wins = {
        'true': [],
        'false': []
    };
    const draw=(x,y)=>{
        tic[x][y]=flag;
        let _win = [];
        for(let x1 in win){
            for(let y1 in win[x1]){
                if(JSON.stringify(win[x1][y1])===JSON.stringify({x,y})||JSON.stringify(win[x1][y1])===JSON.stringify({y,x})){
                    _win.push(x1);
                }
            }
        }
        for(let i in _win){
            wins[flag].push(win[_win[i]]);
        }
        for(let i in wins[flag]){
            for(let b in wins[!flag]){
                console.log(JSON.stringify(wins[!flag][i]),JSON.stringify(wins[flag][b]));
                if(JSON.stringify(wins[!flag][i])==JSON.stringify(wins[flag][b])){
                    wins[flag][b]=='';
                };
            }
        }
        flag=!flag;
        console.log(wins);
    }
</script>

<template>
    <div style="color: #fff;">{{ flag }}</div>
    <div class="tic">
        <div v-for="(line,i) in tic" class="tic-in">
            <div :class="`tic-item ${column===0?'':column?'black':'red'}`" v-for="(column,c) in line" @click.once="draw(i,c)">
                <!-- {{ column }} -->
            </div>
        </div>
    </div>
</template>

<style scoped>
    .tic{
        width: 200px;
        height: 100%;
        background-color: #fff;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
    }
    .tic-item{
        width: 60px;
        height: 60px;
        background-color: rgb(156, 156, 156);
        -webkit-app-region: no-drag;
        margin: 2px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .tic-in{
        display: flex;
        height: 100%;
        justify-content: center;
        flex-direction: column;
    }
    .black{
        background-color: #000!important;
    }
    .red{
        background-color: #ff0000!important;
    }
</style>