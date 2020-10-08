// vue.config.js

const path = require('path'); //引入path模块
function resolve(dir) {
  return path.join(__dirname, dir) //path.join(__dirname)设置绝对路径
}

module.exports = {
  lintOnSave: false,
  runtimeCompiler:true,
  pages:{
    index:{
      entry: 'src/main.js',
      // 模板来源
      template: 'public/index.html',
      // 在 dist/index.html 的输出
      filename: 'index.html',
    },
    addtags:{
      entry: 'src/addTags.js',
      // 模板来源
      template: 'public/index.html',
      // 在 dist/index.html 的输出
      filename: 'addTags.html',
    }
  },
  chainWebpack: (config) => {
    config.resolve.alias
      //set第一个参数：设置的别名，第二个参数：设置的路径
      .set('@', resolve('./src'))
      .set('view', resolve('./src/view'))
      .set('plugins', resolve('./src/view/plugins'))
      .set('pages', resolve('./src/view/pages'))
      .set('utils', resolve('./src/view/utils'))
      .set('routes', resolve('./src/view/routes'))
      .set('components', resolve('./src/view/components'))
      .set('assets', resolve('./src/view/assets'))
  },

  pluginOptions: {
    electronBuilder: {
      mainProcessFile: 'src/background.js',
      chainWebpackMainProcess: config => {
        config.resolve.alias
          .set('@', resolve('./src'))
          .set('main', resolve('./src/main'))
      },
      builderOptions: {
        appId: 'TagFiles',
        productName: 'TagFiles', // 项目名，也是生成的安装文件名，即wyDemo.exe
        copyright: '@none.Warmer Copyright © 2020', // 版权信息
        
        /* files: [
          'src/main/*'
        ],
        extraFiles: [ // 把指定的资源复制到程序根目录，即把server文件夹的内容复制到程序根目录，这里server文件夹下的内容相当于我的后台，我在background.js中有相应的处理。
          './server'
        ], */
        // directories: {
        //   output: './dist_electron' // 输出文件路径
        // },
        win: { // win相关配置
          icon: './logo.ico', // 图标，当前图标在根目录下，注意这里有两个坑
          requestedExecutionLevel: 'requireAdministrator', // 获取管理员权限
          target: [{
            target: 'nsis', // 利用nsis制作安装程序
            arch: [
              'x64'
            ]
          }]
        },
        nsis: {
          oneClick: false, // 是否一键安装
          allowElevation: true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
          allowToChangeInstallationDirectory: true, // 允许修改安装目录
          installerIcon: './logo.ico', // 安装图标
          uninstallerIcon: './logo.ico', // 卸载图标
          installerHeaderIcon: './logo.ico', // 安装时头部图标
          createDesktopShortcut: true, // 创建桌面图标
          createStartMenuShortcut: true, // 创建开始菜单图标
          shortcutName: 'TagFile', // 图标名称(项目名称)
          include: "./installer.nsh" //写入注册表
        }
      }
      // mainProcessWatch: ['src/myFile1', 'src/myFile2'],
      // mainProcessArgs: ['--arg-name', 'arg-value']
    }
  }
}
