/**
 * 逻辑处理——service层
*/

const FS = require('./FsUtils')
const DB = require('./dao')
const fs = require('fs')
const path = require('path')


/**
 * 添加文件夹(根据path和id)中的文件到系统 —— 异步
 * @param  fpath 文件夹地址
 * @param  fid 文件夹id
 * @return 文件夹不存在返回null 保存成功返回true 失败返回false
 */
async function addFilesOfFolderById(fpath, fid) {
  var allfiles = FS.getFilesFromFolder(fpath)
  if (allfiles == null)
    return null
  if (allfiles.length === 0) return true
  allfiles = allfiles.filter((file) => {
    return file.type !== '文件夹'
  })
  //console.log(allfiles)
  var rs = await DB.addFilesByFatherId(allfiles, fid)
  //console.log("插入文件结果"+rs)
  return rs
}

/**
 * 添加文件夹到系统 --异步
 * @param fpath-指定文件夹路径
 * - 如果路径不存在，返回null
 * - 路径存在，将文件夹存入数据库
 * - 遍历子文件夹，将子文件夹存入数据库
 * - 根据子文件夹遍历文件，将文件存入数据库
 * @return "xxxx" --地址  false 添加失败
 */
async function addAllOfFolder(fpath) {
  var childFolders = FS.getFoldersFromFolder(fpath)
  if (childFolders == null)
    return null
  var cur_fileinfo = FS.getFileInfo(fpath)
  cur_fileinfo.path = fpath
  //添加文件夹到数据库
  var rs = await DB.addFiles([cur_fileinfo])
  if (rs == false)
    return null
  var cur_id = rs[0]
  //添加文件夹下文件到数据库
  rs = await addFilesOfFolderById(fpath, cur_id)
  childFolders = childFolders.map(fpath => {
    var fileinfo = FS.getFileInfo(fpath)
    fileinfo.path = fpath
    return fileinfo
  })
  //添加文件夹下全部子文件夹到数据库
  rs = await DB.addFilesByFatherId(childFolders, cur_id)
  if (rs) {
    for (var i = 0; i < rs.length; i++) {
      // 添加全部子文件到数据库
      await addFilesOfFolderById(childFolders[i].path, rs[i])
    }
    return FS.getFileInfo(fpath)
  } else {
    return false
  }
}


/**
 * 在数据库中删除指定路径的文件夹及其子文件
 * @param folder - 指定文件夹路径
 * @return 成功返回删除数量 文件夹不存在/删除失败返回null
 */
async function clearFolder(fpaths) {
  var rs = await DB.deleteFoldersAllByPath(fpaths)
  return rs
}

/**
 * 批量删除文件/文件夹 根据指定路径
 * @param fpaths 路径数组
 * 
 */
async function clearFilesByPaths(fpaths) {
  var folders = []
  var files = []
  for (var f of fpaths) {
    var ftype = FS.getFileInfo(f).type
    if (ftype === '文件夹') {
      folders.push(f)
    } else {
      files.push(f)
    }
  }
  await clearFolder(folders)
  await DB.deleteFilesByPath(files)
  return true
}





/**
 * 局部更新文件夹
 * @param fpath - 文件夹地址
 * @return 如果文件夹不存在，返回null 否则返回更新后的全部子文件/夹
 * 读取文件夹内子文件，子文件如果存在于数据库，则返回数据库中信息
 * 如果不存在于数据库，插入该文件到数据库
 * 如果数据库中属于该文件夹的文件已经不存在:
 * - 如果文件类型是文件夹，深度删除
 * - 如果文件类型是文件，直接删除
 */
async function getAndRefreshFolder(fpath) {
  var childOfDisk = FS.getFilesFromFolder(fpath)
  if (childOfDisk == null)
    return null
  var childOfSql = await DB.getChildrenByPath(fpath)
  if (childOfSql == null) {
    //console.log("null")
    return null
  }
  var insertChildren = childOfDisk
  if (childOfSql.length > 0) {
    var extraOfSql = FS.leftDiff(childOfSql, childOfDisk, "path")
    var deletePaths = []
    for (var exf of extraOfSql) {
      deletePaths.push(exf.path)
    }
    await clearFilesByPaths(deletePaths)
    insertChildren = FS.leftDiff(childOfDisk, childOfSql, "path")
    childOfDisk = FS.intersection(childOfSql, childOfDisk, "path")
  }
  var insertFiles = []
  for (var f of insertChildren) {
    if (f.type == "文件夹")
      await addAllOfFolder(f.path)
    else
      insertFiles.push(f)
  }
  var rs = await DB.addFiles(insertFiles)
  return childOfDisk.map(file=>{
      var finfo = FS.getFileInfo(file.path)
      file.name = finfo.name
      file.fullName = finfo.fullName
      return file
    }) // 返回真实硬盘数据
}


/**
 * 更新标签
 * @param file - file.path文件对应的路径 file.tags - 新的标签
 * 检查文件是否存在，不存在返回null 且删除数据库中记录
 * 存在，则更新，更新失败返回false 更新成功返回true
 */
async function updateTags(file) {
  if (file == null || !fs.existsSync(file.path)) {
    return null
  }
  var rs = await DB.updateTags(file)
  return rs
}



/**
 * 指定文件夹搜索
 * @param tags =['',''] folders=['','']
 * @return [{}]
 */
async function searchTags(tags, folders=null) {
    console.log("搜索对象：",folders)
    var result = []
    if(folders!=null&&folders.length>0)
        result = await DB.getFilesByTagsAndFolders(tags, folders)
    else result = await DB.getFilesByTags(tags)
    
    if (result == null) return null
    var deleteFiles = []
    var last_result = []
    for (var file of result) {
        if (!fs.existsSync(file.path)) {
            deleteFiles.push(file.path)
        } else {
            last_result.push(file)
        }
    }
    await clearFilesByPaths(deleteFiles)
    last_result = last_result.map(file => {
        var finfo = FS.getFileInfo(file.path)
        file.name = finfo.name
        file.fullName = finfo.fullName
        return file
    })
    console.log("搜索结果", last_result)
    return last_result
}

/**
 * 同步硬盘上指定文件夹中的文件
 * @param fpath - 文件夹路径
 */
async function syncFolderOfDisk(folder) {

}

/**
 * 获取顶层文件夹 father = 0
*/
async function getTopFolder(){
    var rs = await DB.getFilesByFather(0)
    rs = rs.filter(file=>{
        return file.type=='文件夹'
    }).map(file=>{
        return FS.getFileInfo(file.path)
    })
    return rs
}


/**
 * 保存批量文件到文件夹
 * files[{path: type:}] folder目标文件夹路径
 * 成功返回true 失败返回false/null
 */
function saveFilestoFolder(files, folder) {
    if(!fs.existsSync(folder)) return null
    for (var f of files) {
        f = FS.getFileInfo(f.path)
        if(f.type=='文件夹') f.fullName = f.name
        else f.fullName = f.name+"."+f.type
        var newPath = path.resolve(folder, f.fullName)
        if (f.exist&&newPath != f.path) {
        // 文件存在，不是文件夹且和原来文件不在一个目录
            if (f.type == '文件夹') {
                try {
                    CopyDir(f.path, folder)
                } catch (error) {
                    return false
                }
            } else {
                var count = 0
                while (fs.existsSync(newPath)) { // 处理重名
                    count += 1
                    newPath = path.resolve(folder, f.name + '(' + count + ').' + f.type)
                }
                try {
                    fs.writeFileSync(newPath, fs.readFileSync(f.path))
                } catch (error) {
                    return false
                }
            }
        }
    }
    return true
}


/**
 * 拷贝文件夹到指定文件夹下
 */
function CopyDir(folderPath, destPath) {
  if (!fs.existsSync(destPath)) { // 指定文件夹不存在
    return false
  }
  var folder_name = folderPath.split(path.sep).pop()
  var newPath = path.resolve(destPath, folder_name)
  var count = 0
  while (fs.existsSync(newPath)) {
    // 同名
    count += 1
    newPath = path.resolve(destPath, folder_name + '(' + count + ')')
  }
  fs.mkdirSync(newPath)
  var files = fs.readdirSync(folderPath)
  files.forEach((_file) => {
    var o_f_path = path.join(folderPath, _file)
    var n_f_path = path.join(newPath, _file)
    if (fs.statSync(o_f_path).isFile()) {
      // 拷贝文件
      fs.writeFileSync(n_f_path, fs.readFileSync(o_f_path))
    } else {
      // 拷贝文件夹
      CopyDir(o_f_path, newPath)
    }
  })
}


/**
 * 删除全部选中文件及文件夹从硬盘&系统
 * files:[{path}]
 */
async function deleteFilesFromDisk(files) {
    var deletePaths = []
    for (var f of files) {
        deletePaths.push(f.path)
        if (f.type === '文件夹') {
            deleteFolderFromDisk(f.path)
        } else {
            if (fs.existsSync(f.path))
                fs.unlinkSync(f.path)
        }
    }
    await clearFilesByPaths(deletePaths)
    return true
}

/**
 * 删除文件夹及其全部子文件从系统和硬盘
 * @param fpath 文件夹地址
*/
function deleteFolderFromDisk(fpath) {
    if(fs.existsSync(fpath)){
        var files = fs.readdirSync(fpath)
        for(var f of files){
            var curPath = path.resolve(fpath,f)
            if (fs.statSync(curPath).isDirectory())
                deleteFolderFromDisk(curPath)
            else fs.unlinkSync(curPath)
        }
        fs.rmdirSync(fpath)
    }
}

/**
 * 根据路径获取文件信息
 * 如果文件存在数据库中，则返回文件信息
 * 如果文件不存在数据库，返回文件信息
*/
async function getFileByPath(fpath){
    if(fs.existsSync(fpath)){
        var file = await DB.getFileByPath(fpath)
        if(file==null||file==undefined){
            var finfo = FS.getFileInfo(fpath)
            await DB.addFiles([finfo])
            return finfo
        }else{
            return file
        }
    }
}

/**
 * getFileByPath 的批量操作
 * 根据路径获取文件信息，如果存在数据库中，返回数据库中信息
 * 如果不存在数据库中，返回文件信息并保存到数据库
*/
async function getFilesByPaths(fpaths) {
    var result = []
    var addFiles = []
    fpaths = fpaths.filter(fp=>{
        return fs.existsSync(fp)
    })
    var filesInDb = await DB.getFilesByPaths(fpaths)
    filesInDb = filesInDb.map(file=>{
        var finfo = FS.getFileInfo(file.path)
        finfo.tags = file.tags
        return finfo
    })
    var tmpObjarr = fpaths.map(fp=>{
        return {path:fp}
    })
    var filesNotInDb = FS.leftDiff(tmpObjarr, filesInDb,'path')
    filesNotInDb.map(fnd=>{
        var finfo = FS.getFileInfo(fnd.path)
        addFiles.push(finfo)
    })
    await DB.addFiles(addFiles)
    return addFiles.concat(filesInDb)

}


//=================================

module.exports.addFilesOfFolderById = addFilesOfFolderById
module.exports.addAllOfFolder = addAllOfFolder
module.exports.clearFolder = clearFolder
module.exports.clearFilesByPaths = clearFilesByPaths
module.exports.getAndRefreshFolder = getAndRefreshFolder
module.exports.updateTags = updateTags
module.exports.searchTags = searchTags
module.exports.getTopFolder = getTopFolder
module.exports.saveFilestoFolder = saveFilestoFolder
module.exports.CopyDir = CopyDir
module.exports.deleteFilesFromDisk = deleteFilesFromDisk
module.exports.deleteFolderFromDisk = deleteFolderFromDisk
module.exports.getFileByPath = getFileByPath
module.exports.getFilesByPaths = getFilesByPaths
