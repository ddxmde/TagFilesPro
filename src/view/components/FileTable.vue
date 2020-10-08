<!--
Description
@authors Your Name (you@example.org)
@date    2020-09-29 19:01:11
@version 1.0.0
-->
<template>
  <div>
    <el-table stripe :show-header="false" :row-style="setRowStyle"
      :data="folders"
      style="width: 100%">
        <el-table-column type="expand">
            <template slot-scope="scope">
                <div label-position="left"  class="table-expand">
                    <el-tag closable size="medium" type="danger" style="float:left;margin-left:10px;margin-top:10px;"
                        v-for="(tag,taginx) in scope.row.tags" :key="tag"  @close="removeTag(scope.$index,tag)">
                        {{tag}}
                    </el-tag>
                    <div style="width:100%;margin-top:10px;clear:both;">
                        <el-input :key="scope.row.path" size="small" placeholder="输入标签用 / 隔开" v-model="newTags" class="input-with-button">
                            <el-button :key="'btn'+scope.$index" slot="append" type="info" @click="addTags(scope.$index)">添加</el-button>
                        </el-input>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column width="360">
            <template slot-scope="scope">
            <div class="folderName">
                <i class="el-icon-picture-outline" v-if="scope.row.labelType=='image'"></i>
                <i class="el-icon-document" v-else-if="scope.row.labelType=='doc'"></i>
                <i class="el-icon-box" v-else-if="scope.row.labelType=='rar'"></i>
                <i class="el-icon-film" v-else-if="scope.row.labelType=='video'"></i>
                <span v-else>
                    <i class="el-icon-folder" v-if="scope.row.type=='文件夹'"></i>
                    <i class="el-icon-coin" v-else></i>
                </span>
                <el-tooltip class="item" effect="light"
                    :content="scope.row.path" placement="bottom">
                <span style="margin-left: 10px">{{ scope.row.name }}</span>
                </el-tooltip>
            </div>
            </template>
        </el-table-column>
        <el-table-column
            width="180">
            <template slot-scope="scope">
                <el-popover
                    placement="right-end"
                    width="320"
                    trigger="hover" v-if="scope.row.labelType=='image'">
                    <img :src="getSafePath(scope.row.path)" width="320px" />
                    <div slot="reference">
                        <span style="margin-left:10px" v-if="scope.row.type!='文件夹'">类型：{{ scope.row.type }}</span>
                    </div>
                </el-popover>
                <div v-else>
                        <span style="margin-left:10px" v-if="scope.row.type!='文件夹'">类型：{{ scope.row.type }}</span>
                </div>

            </template>
        </el-table-column>
        <el-table-column fixed="right">
            <template slot-scope="scope">
            <el-button
                size="mini" type="primary"
                @click="handleOpen(scope.row)">打开</el-button>
            <el-button
                size="mini" type="warning"
                @click="$emit('goparent',scope.row)">上级目录</el-button>
            </template>
        </el-table-column>
    </el-table>
  </div>
</template>

<script>
const {
  ipcRenderer, shell
} = window.require('electron')
export default {
  name: 'FileTable',
  data () {
    return {
      newTags: ''
    }
  },
  props: {
    folders: {
      type: Array,
      default: []
    }
  },
  mounted () {
    // this.getSysFolders()
  },
  methods: {
    
    ArrayToTags(tagsarr){
      return tagsarr.join(" ")
    },
    getSafePath (path) {
      // return `${__safeFileProtocol}://${path}`
      return `electrondemo-safe-file-protocol://${path}`
    },
    setRowStyle ({ row, rowIndex }) {
      if (rowIndex % 2 == 0) {
        return { 'background-color': '#f3f9f1', cursor: 'pointer', color: '#2e4e7e' }
      } else return { 'background-color': '#e0eee8', cursor: 'pointer', color: '#2e4e7e' }
    },
    addTags (index) {
      var oldtags = this.folders[index].tags
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
      var updateTargrt = JSON.parse(JSON.stringify(this.folders[index]))
      updateTargrt.tags = this.ArrayToTags(oldtags)// 老标签--更新成功后再赋值
      var _that = this

      // console.log("当前文件路径"+this.$route.params.targetFolder)
      ipcRenderer.send('update-tags', updateTargrt)
      ipcRenderer.once('update-tags-response', (event, args) => {
        if (args) {
          updateTargrt.tags = oldtags
          _that.folders[index] = updateTargrt
          _that.openMessage('更新成功')
        } else {
          _that.folders = _that.folders.filter(itm=>{
              return itm != _that.folders[index]
          })
          _that.openMessage('更新失败,系统出错或文件已经被删除，请刷新重试', 'error')
          _that.$emit('goparent',_that.folders[index])
        }
      })
      this.newTags = null
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
    removeTag (index, tag) {
      var _that = this
      var oldtags = _that.folders[index].tags
      oldtags = oldtags.filter(t => {
        return t != tag
      })
      console.log(oldtags)
      var updateTargrt = _that.folders[index]
      updateTargrt.tags = _that.ArrayToTags(oldtags)
      ipcRenderer.send('update-tags', updateTargrt)
      ipcRenderer.once('update-tags-response', (event, args) => {
        if (args) {
          updateTargrt.tags = oldtags
          _that.folders[index] = updateTargrt
          _that.openMessage('更新成功')
        } else {
          _that.openMessage('更新失败', 'error')
          _that.$emit('goparent',_that.folders[index])
        }
      })
    },
    handleOpen (row) {
      if (row.type == '文件夹') {
        this.$emit('openChild', row)
      } else {
        shell.showItemInFolder(row.path)
      }
    }
  }
}
</script>

<style lang="css" scoped>
  .table-expand{
      width:100%;
      padding:10px;
      margin:0;
  }
  .folderName{
    font-size:16px;
    font-weight:bold;
  }
  .folderName  i{
    font-size:20px;
  }
  .input-with-button{
      width:260px;
      margin-left:10px;
      margin-top:10px;
  }
</style>
