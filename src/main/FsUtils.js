/**
 * 本地文件工具库
*/

const fs = require('fs')
const path = require('path')


/**
 * 根据路径获取文件信息 
 * {
        exist,//是否存在
        name, //短名字
        type, //类型
        fatherPath //父文件夹路径
    }
*/
function getFileInfo(fpath) {
  var fullName = fpath.split(path.sep).pop()
  var name = fullName.split(".")[0]
  var type = fullName.split('.')[1] || '文件夹'
  var father = fpath.split(path.sep).slice(0, -1).join(path.sep)
  var exist = fs.existsSync(fpath)
  return {
    exist,
    name,
    type,
    father,
    tags: name + " " + type,
    path:fpath,
    fullName
  }
}

/**
 * 根据路径获取文件夹全部文件(包括文件夹)
 * 如果文件夹不存在，返回null
 */
function getFilesFromFolder(fpath) {
  var result = []
  if (!fs.existsSync(fpath))
    return null
  var files = fs.readdirSync(fpath)
  for (var f of files) {
    var filepath = path.resolve(fpath, f)
    var fileinfo = getFileInfo(filepath)
    fileinfo.path = filepath
    result.push(fileinfo)
  }
  return result
}


/**
 * 根据fileinfo计算出 文件路径
 */
function getPath(fileInfo) {
  var ftype = fileInfo.type === 'dir' ? '' : "." + fileInfo.type
  return path.resolve(fileInfo.fatherPath, fileInfo.name + ftype)
}

/**
 * 递归获取文件夹中全部子文件夹
 * 文件夹不存在返回null
 */
function getFoldersFromFolder(fpath) {
  var result = []
  if (!fs.existsSync(fpath))
    return null
  var files = fs.readdirSync(fpath)
  for (var f of files) {
    var childPath = path.resolve(fpath, f)
    var fstat = fs.statSync(childPath)
    if (fstat.isDirectory()) {
      result.push(childPath)
      result = result.concat(getFoldersFromFolder(childPath))
    }
  }
  return result
}


/**
 * 求A中不存在B中的元素 差集
 */
function leftDiff(A, B, attr = null) {
  if (attr == null)
    return A.filter(a => {
      return B.indexOf(a) === -1
    })
  var result = []
  var attrInB = B.map(b => {
    return b[attr]
  })
  for (var a of A) {
    if (attrInB.indexOf(a[attr]) == -1) {
      result.push(a)
    }
  }
  return result
}

/**
 * 求AB交集 用A中元素替代B 且返回B的新数组
 */
function intersection(A, B, attr = null) {

  if (attr == null) {
    return B.map(b => {
      if (A.indexOf(b) > -1) return A[indexOf(b)]
      return b
    })
  }
  var attrInA = A.map(a => {
    return a[attr]
  })
  for (var i = 0; i < B.length; i++) {
    if (attrInA.indexOf(B[i][attr]) > -1) {
      B[i] = A[attrInA.indexOf(B[i][attr])]
      //console.log("b[i]",B[i])
    }
  }

  return B
}

//=================================
module.exports.getFileInfo = getFileInfo
module.exports.getFilesFromFolder = getFilesFromFolder
module.exports.getPath = getPath
module.exports.getFoldersFromFolder = getFoldersFromFolder
module.exports.leftDiff = leftDiff
module.exports.intersection = intersection