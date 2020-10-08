<!--
Description
@authors Your Name (you@example.org)
@date    2020-10-08 17:01:28
@version 1.0.0
-->
<template>
  <div style="width:400px;">
    <div style="width:100%;margin:10px;">
        <el-tag closable size="medium" type="danger" style="float:left;margin-left:10px;margin-top:10px;"
                            v-for="(tag,taginx) in curFile.tags" :key="tag"  @close="removeTag(tag)">
                            {{tag}}
        </el-tag>
    </div>
    <div style="width:100%;text-align:center;margin-top:10px;clear:both">
        <el-button style="float:left;margin-left:20px;margin-top:10px;" type="danger" @click="close()">退出</el-button>
        <el-input placeholder="输入标签用 / 隔开" v-model="newTags" class="input-with-button">
            <el-button  slot="append" type="info" @click="addTags()">添加</el-button>
        </el-input>
        
    </div>
  </div>
</template>

<script>
const {
  ipcRenderer
} = window.require('electron')
  export default {
      name: 'app',
      data(){
          return{
              newTags:"",
              filePath:"",
              curFile:{}
          }
      },
      mounted() {
            var _that = this
            console.log("进入页面")
            ipcRenderer.send('getProcessArgs')
            ipcRenderer.on('getProcessArgs-response',(event, args)=>{
                console.log(args)
                _that.filePath = args[1]
                if(_that.filePath){
                    ipcRenderer.send('get-one-file',_that.filePath)
                    ipcRenderer.once('get-one-file-response', (event, args) =>{
                        console.log(args)
                        _that.curFile = args
                        if(_that.curFile){
                            var tags = args.tags.split(" ")
                            _that.curFile.tags = tags
                        }
                    })
                }
            })
            

      },
      methods: {
            ArrayToTags(tagsarr){
            return tagsarr.join(" ")
            },
            openMessage (message, type = 'success') {
                console.log(type)
                this.$message({
                    message,
                    type,
                    duration: 2000,
                    offset: 20
                })
            },
            addTags(){
                var _that = this
                var oldtags = _that.curFile.tags
                var newTagArr = this.newTags.split('/')
                newTagArr.map((itm) => {
                    itm = itm.replace(/(^\s*)|(\s*$)/g, '')
                    var i = 0
                    for (;i < oldtags.length; i++) {
                    if (oldtags[i].indexOf(itm) > -1) {
                        break
                    }
                    if (itm.indexOf(oldtags[i]) > -1) {
                        oldtags[i] = itm
                        break
                    }
                    }
                    if (i == oldtags.length) { oldtags.push(itm) }
                    return itm
                })
                var updateTargrt = JSON.parse(JSON.stringify(_that.curFile))
                var oldupdateTargrt = JSON.parse(JSON.stringify(_that.curFile))
                updateTargrt.tags = this.ArrayToTags(oldtags)// 老标签--更新成功后再赋值
                console.log(updateTargrt)
                ipcRenderer.send('update-tags', updateTargrt)
                ipcRenderer.once('update-tags-response', (event, args) => {
                    console.log(args)
                    if (args) {
                        updateTargrt.tags = oldtags
                        _that.curFile = updateTargrt
                        _that.openMessage('更新成功')
                    } else {
                        _that.curFile = oldupdateTargrt
                        _that.openMessage('更新失败,系统出错或文件已经被删除，请刷新重试', 'error')
                    }
                })
                this.newTags = null
            },
            close(){
                ipcRenderer.send('window-close')
            },
            removeTag (tag) {
                var _that = this
                var oldtags = _that.curFile.tags
                console.log(oldtags)
                var updateTargrt = JSON.parse(JSON.stringify(_that.curFile))
                var oldupdateTargrt = JSON.parse(JSON.stringify(_that.curFile))
                oldtags = oldtags.filter(t=>{
                    return tag!=t
                })
                updateTargrt.tags = _that.ArrayToTags(oldtags)
                console.log(updateTargrt)
                ipcRenderer.send('update-tags', updateTargrt)
                ipcRenderer.once('update-tags-response', (event, args) => {
                    console.log(args)
                    if (args) {
                        updateTargrt.tags = oldtags
                        _that.curFile = updateTargrt
                        _that.openMessage('更新成功')
                    } else {
                        _that.curFile = oldupdateTargrt
                        _that.openMessage('更新失败', 'error')
                    }
                })
            }
        }
  }
</script>

<style lang="css" scoped>
    .input-with-button{
        float:right;
      width:260px;
      margin-right:10px;
      margin-top:10px;
  }
</style>
