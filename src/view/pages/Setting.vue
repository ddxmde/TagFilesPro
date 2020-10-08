<!--
Description
@authors Your Name (you@example.org)
@date    2020-10-01 05:40:51
@version 1.0.0
-->
<template>
  <div>
    <el-dialog
        title="TagFiles 使用提示:"
        :visible.sync="centerDialogVisible"
        width="80%" :show-close="false"
        center>
        <p>1. 【重要】不要删除程序目录内的json文件</p>
        <p>2. 不要删除文件夹内的 <i>文件夹名-data.json</i> 文件,以免造成数据丢失</p>
        <p>3. 尽量不要添加子文件夹过多，目录深度过深的文件夹</p>
        <span slot="footer" class="dialog-footer">
            <el-button type="primary" @click="handleClick()">好的</el-button>
        </span>
    </el-dialog>
    <p v-for="(itm,inx) in result">{{itm}}</p>
  </div>
</template>

<script>
const { ipcRenderer } = window.require('electron')
export default {
  name: 'Setting',
  data () {
    return {
      centerDialogVisible: false,
      result:[]
    }
  },
  methods: {
    handleClick () {
      this.$router.push({ name: 'Main' })
    },
    ipctest(){
      ipcRenderer.send('runtest',10)
      ipcRenderer.on('getdata-test', (event, args) => {
        if (args) {
          this.result.push(args)
        }
      })
    }
  },
  mounted() {
    this.ipctest()
  },
}
</script>

<style lang="css" scoped>

</style>
