/**
 * ipcMain - 事件监听列表 负责监听及处理 render Process 发送的事件
*/


export default function bar() {
	//
	const {
		ipcMain, dialog
	} = require('electron')

	const service = require('./service')

	/**
	 * 获取已添加的顶层文件夹 father=0
	 */
	ipcMain.on('get-folders', (event) => {
		service.getTopFolder().then((rs) => {
			event.reply('send-folders', rs)
		})
	})

	/**
	 * 添加文件夹到系统
	 * rs 成功返回文件路径 失败返回false 不存在返回null
	*/
	ipcMain.on('open-directory-dialog', (event, args) => {
		dialog.showOpenDialog({
			properties: [args]
		}).then((rs) => {
			if (!rs.canceled) { // 如果有选中
				// 发送选择的对象给子进程
				console.log(rs.filePaths[0])
				service.addAllOfFolder(rs.filePaths[0]).then(rs => {
					event.reply('add-folders-response', rs)
				})
			} else {
				event.reply('add-folders-response', null)
			}
		})
	})

	/**
	 * 从系统删除指定路径arg的文件
	 * rs 失败返回null 成功返回删除数量
	*/
	ipcMain.on('delete-folder', (event, arg) => {
		service.clearFolder([arg]).then(rs => {
			event.reply('delete-folder-response', rs)
		})
	})

	/**
	 * 获取指定路径arg文件夹下的文件
	 * rs 文件列表
	*/
	ipcMain.on('get-files', (event, arg) => {
		service.getAndRefreshFolder(arg).then(rs => {
			event.reply('send-files', rs)
		})
	})

	/**
	 * 更新指定路径的文件的标签
	 * arg {path,tags}
	 * true 更新成功 false更新失败 null文件不存在
	*/
	ipcMain.on('update-tags', (event, arg) => {
		service.updateTags(arg).then(rs => {
			event.reply('update-tags-response', rs)
		})
	})

	/**
	 * 搜索标签， args包含指定的文件夹列表args[0] 标签列表args[1]， 如果为空则全局搜索
	*/
	ipcMain.on('search-tags', (event, args) => {
		service.searchTags(args[1], args[0]).then(rs => {
			event.reply('search-tags-response', rs)
		})
	})

	// 更新文件夹 - 用户在app以外添加或删除文件之后数据更新
	/* ipcMain.on('update-folders', (event, args) => {
	  console.log('进入update-folders')
	  updateFolder()
	  event.reply('update-folders-response')
	}) */

	/**
	 * 批量导出文件 / 文件夹
	 * args 文件路径数组
	 * 
	*/
	ipcMain.on('patch-save', (event, args) => {
		dialog.showOpenDialog({
			properties: ['openDirectory']
		}).then((rs) => {
			var save_or_not = false
			if (!rs.canceled) { // 如果有选中
				console.log(rs.filePaths[0])
				save_or_not = service.saveFilestoFolder(args, rs.filePaths[0])
			}
			event.reply('patch-save-response', save_or_not)
		})
	})


	/**
	 * 批量删除文件
	*/
	ipcMain.on('patch-delete', (event, args) => {
		service.deleteFilesFromDisk(args).then(rs => {
			event.reply('patch-delete-response', rs)
		})
	})

	/**
	 * 鼠标右键给文件添加标签
	*/
	ipcMain.on('addtags-onclick', (event, args) => {
		service.deleteFilesFromDisk(args).then(rs => {
			event.reply('patch-delete-response', rs)
		})
	})

	/**
	 * 鼠标右键给文件添加标签
	*/
	ipcMain.on('get-one-file', (event, args) => {
		service.getFileByPath(args).then(rs => {
			event.reply('get-one-file-response', rs)
		})
	})

	/**
	 * 处理拖拽文件事件
	*/
	ipcMain.on('get-files-info', (event, filesPath) => {
		service.getFilesByPaths(filesPath).then((rs)=>{
			event.reply('get-files-info-response',rs)
		})
	})

	/**
	 * 移除单个文件- 从数据库
	*/
	ipcMain.on('remove-one-file', (event, fpath) => {
		service.clearFilesByPaths([fpath]).then((rs) => {
			event.reply('remove-one-file-response', rs)
		})
	})

}



