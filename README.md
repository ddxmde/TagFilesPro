# TagFilesPro

更新-0.1.2
- 批量添加文件
- 移除文件
- 修复标签显示bug

技术栈：

- vue-cli
- vue-router
- vue-plugin-electron-builder
- sqlite3

升级：

- 从文件保存升级到数据库保存。

- 鼠标右键 `添加文件到TagFiles` 轻松为任意文件添加tag.
- 目录结构清晰，`src/main` 目录是主线程目录
  - dao -- 数据库DAO及数据库默认配置
  - service -- 处理请求的逻辑处理
  - FsUtils -- 文件处理相关
  - ipcEvent -- 监听ipcMain 和 ipcRender 通信



填坑：

- vue-cli多入口配置
- electron添加注册表
- sqlite3 异步api转同步
- webpack配置相关。



