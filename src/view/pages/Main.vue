<!--
Description
@authors Your Name (you@example.org)
@date    2020-09-27 02:50:22
@version 1.0.0
-->
<template><div v-loading.fullscreen.lock="fullscreenLoading" style="height:100%" ref="mainDom" >
    <div class="containerHeader">
        <el-button type="primary" icon="el-icon-upload2"
            size="small" @click="addFolder">添加文件夹</el-button>
        <el-button type="danger" icon="el-icon-refresh"
            size="small" @click="refresh">刷新</el-button>
        <el-button type="danger"  icon="el-icon-check"
            size="small" @click="updateall">更新</el-button>
    </div>
    <el-table  :show-header="false"
      :data="folders"
      style="width: 100%" :row-style="setRowStyle">
      <el-table-column>
        <template slot-scope="scope">
          <div class="folderName">
            <i class="el-icon-folder-opened"></i>
            <el-tooltip class="item" effect="light"
                :content="scope.row.path" placement="bottom">
              <span style="margin-left: 10px">{{ scope.row.name }}</span>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column width="230px" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini" type="primary"
            @click="handleOpen(scope.row.path)">打开</el-button>
          <el-button
            size="mini"
            type="danger"
            @click="handleDelete(scope.row.path)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
</div>
</template>

<script>
const {
  ipcRenderer
} = window.require('electron')
export default {
  name: 'Main',
  data () {
    return {
      folders: [],
      fullscreenLoading: false,
      notify: {}
    }
  },
  mounted () {
    this.getFolders()
    this.bindDrag()
  },
  methods: {
    getFolders () {
      var _that = this
      ipcRenderer.send('get-folders')
      ipcRenderer.on('send-folders', (event, args) => {
        console.table(args)
        _that.folders = args
      })
    },
    openMessage (message, type = 'success') {
      console.log(type)
      this.$message({
        message,
        type,
        duration: 2000,
        offset: 120
      })
    },
    addFolder () {
      // 添加新文件夹
      var folder_path = ''
      var _that = this
      _that.fullscreenLoading = true
      ipcRenderer.send('open-directory-dialog', 'openDirectory')
      ipcRenderer.once('add-folders-response', (event, args) => {
        _that.fullscreenLoading = false
        console.log(args)
        if (args == null) {
          // console.log("该文件夹已存在")
          _that.openMessage('取消添加或该文件夹已存在', 'warning')
        } else {
          if (args == false) {
            // console.log("添加文件夹失败")
            _that.openMessage('添加失败', 'error')
          } else {
            _that.getFolders()
            _that.openMessage('成功添加文件夹')
          }
        }
        // setTimeout(_that.notify.close(),2000)
      })
    },
    handleOpen (target) {
      console.log(target)
      this.$router.push({ name: 'Folder', params: { targetFolder: target, searchResult: [] } })
    },
    handleDelete (target) {
      var _that = this
      _that.fullscreenLoading = true
      console.log(target)
      ipcRenderer.send('delete-folder', target)
      ipcRenderer.once('delete-folder-response', (event, args) => {
        _that.fullscreenLoading = false
        if(args==null){
            _that.openMessage('删除失败，请刷新重试')
        }else{
            _that.openMessage('成功删除')
            _that.getFolders()
        }
      })
    },
    refresh () {
      this.getFolders()
    },
    updateall () {
      // var _that = this
      // _that.fullscreenLoading = true
      // ipcRenderer.send('update-folders')
      // ipcRenderer.once('update-folders-response', (event, args) => {
      //   _that.refresh()
      //   _that.fullscreenLoading = false
      //   _that.openMessage('全部更新')
      // })
    },
    setRowStyle ({ row, rowIndex }) {
      if (rowIndex % 2 == 0) {
        return { 'background-color': '#f3f9f1', cursor: 'pointer', color: '#2e4e7e' }
      } else return { 'background-color': '#e0eee8', cursor: 'pointer', color: '#2e4e7e' }
    },
    bindDrag(){
      const dragWrapper = this.$refs.mainDom
      console.log(dragWrapper)
      dragWrapper.addEventListener("drop",(e)=>{
          e.preventDefault(); //阻止e的默认行为
          const files = e.dataTransfer.files;
          var filesPath = []
          for(var i=0;i<files.length;i++){
            filesPath.push(files[i].path)
          }
          ipcRenderer.send('get-files-info',filesPath)
          ipcRenderer.once('get-files-info-response', (event, args) => {
            if(args==null){
                _that.openMessage('添加失败，请刷新重试')
            }else{
                this.$router.push({ name: 'AddFileTable', params: {addFiles:args } })
            }
          })
      })
      //这个事件也需要屏蔽
      dragWrapper.addEventListener("dragover",(e)=>{
          e.preventDefault();
      })
    }
  }
}
</script>

<style lang="css" scoped>
  .el-aside {
    background-color: #f4f4f4;
    color: #FFF;
  }
  .el-menu{
      height:100%;
  }
  .el-menu i{
         font-size:25px;
         color:#ffffff;
  }
  .el-main{
      background:#e9f1f6;
  }
  .el-container{
      height:100%;
  }
  .folderName{
    font-size:16px;
    font-weight:bold;
  }
  .folderName  i{
    font-size:26px;
  }
  .containerHeader{
    padding:10px 0px;
    border-bottom:1px solid #ccc;
    margin-bottom:20px;
  }
</style>
