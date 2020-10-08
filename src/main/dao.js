
const DB = require('./database').DB //es5
//import DB from './sqlite3'  //es6
/**
 * 数据库DAO
 * 在这里配置- 数据库文件地址、表
 */
const path = require('path')
const isDevelopment = process.env.NODE_ENV !== 'production'
const sysPath = process.execPath.split(path.sep)
sysPath.pop()
const DB_NAME = isDevelopment ? './tagfile.db' : path.resolve(sysPath.join(path.sep), 'tagfile.db') 
const CREATE_FILES = "create table files (id INTEGER primary key  AUTOINCREMENT, \
                    path varchar(300)  not null, \
                    tags varchar(100) not null, \
                    type varchar(20) not null, \
                    father int not null)"

const INIT_TABLES = [CREATE_FILES]



//根据db和sqls[创建表的sql语句数组]重建表
async function renewTable(db, sqls) {
  for (var sql of sqls) {
    var rs = await db.run(sql)
    if (!rs) return false
  }
  return true
}

module.exports.renewTable = renewTable

/**
 * 打开数据库创建链接， return db
 * 如果数据库文件[name]不存在， 则创建，创建失败返回null
 * 如果数据表不存在则根据sqls创建 创建失败返回null
 */
async function getDb(name = DB_NAME, sqls = INIT_TABLES) {
  var db = await DB.getInstance(name, sqls)
  if (db === null) {
    return null
  } else {
    var rs = await db.connect()
    if (db.init_tables != null)
      rs = await renewTable(db, sqls)
    if (rs) return db
    else return null
  }
}



//select last_insert_rowid() from person



/**
 * 添加多个文件(夹)到数据库 —— 异步
 * 如果文件已存在直接返回id
 * @param files - 要添加的文件(夹)路径数组
 * file:{path:"",tags:"",father:""//此处是路径}
 * @return 成功result[id:] 失败false
 */
async function addFiles(files) {
  var db = await getDb()
  var reslut = []
  if (db) {
    for (var f of files) {
      var sql = "select id from files where path =?"
      var tmp = await db.get(sql, f.father)
      var father = 0
      //父文件夹不存在数据库 father=0
      //console.log("查询父id:"+tmp)
      if (tmp != undefined && tmp != null) father = tmp.id
      sql = "select id from files where path =?"
      tmp = await db.get(sql, f.path)
      if (tmp === undefined) {
        //console.log(f.path+"文件不存在")
        sql = "insert into files (path,tags,type,father) values(?,?,?,?)"
        tmp = await db.run(sql, [f.path, f.tags, f.type, father])
        //console.log(f.path + "插入结果"+tmp)
        sql = "select last_insert_rowid() as id from files"
        tmp = await db.get(sql)
        //console.log(f.path + "插入返回结果" + tmp)
        if (tmp) {
          reslut.push(tmp.id)
        } else {
          console.log("插入", f, "出错！")
          return false
        }
      } else if (tmp == null) {
        return false
      } else {
        console.log(f, "已存在!")
        reslut.push(tmp.id)
      }
    }
    await db.close()
    return reslut
  } else {
    console.log("数据库出错")
    return false
  }
}



/**
 * 添加多个文件(夹) 到数据库—— 异步 
 * 如果文件已存在直接返回id
 * @param files - 要添加的文件(夹)路径数组
 * files:[{path:"",tags:""}] 
 * @param fatherId father id
 * @return 成功true 失败false
 */
async function addFilesByFatherId(files, fatherId) {
  var db = await getDb()
  var reslut = []
  if (db) {
    for (var f of files) {
      var sql = "select id from files where path =?"
      var tmp = await db.get(sql, f.path)
      if (tmp === undefined) {
        sql = "insert into files (path,tags,type,father) values(?,?,?,?)"
        tmp = await db.run(sql, [f.path, f.tags, f.type, fatherId])
        sql = "select last_insert_rowid() as id from files"
        tmp = await db.get(sql)
        if (tmp) {
          reslut.push(tmp.id)
        } else {
          console.log("插入" + f + "出错！")
          return false
        }
      } else if (tmp == null) {
        console.log("插入" + f + "出错！")
        return false
      } else {
        console.log(f + "已存在!")
        reslut.push(tmp.id)
      }
    }
    await db.close()
    return reslut
  } else {
    console.log("数据库出错")
    return false
  }
}



/**
 * 更新多个文件(夹)的tags到数据库 - 同步
 * @param files - 要添加的文件(夹)路径数组
 * file:{path:"",tags:""}
 * @return 成功true 失败false
 */
async function updateFiles(files) {
  var db = await getDb()
  if (db) {
    for (var f of files) {
      var sql = "select *  from files where path =?"
      var tmp = await db.get(sql, f.path)
      if (tmp != null && tmp != undefined) {
        sql = "update files set tags = ? where id= ?"
        tmp = await db.run(sql, [f.tags, tmp.id])
        if (!tmp) {
          console.log("更新" + f + "出错！")
          return false
        }
      }
    }
    await db.close()
    return true
  } else {
    console.log("数据库出错")
    return false
  }
}

/**
 * 更新指定path的tags到数据库 
 * @param files - 要添加的文件(夹)路径数组
 * file:{path:"",tags:""}
 * @return 成功true 失败false
 */
async function updateTags(file) {
  var db = await getDb()
  if (db) {
    var sql = "select *  from files where path =?"
    var tmp = await db.get(sql, file.path)
    if (tmp != null && tmp != undefined) {
      sql = "update files set tags = ? where id= ?"
      tmp = await db.run(sql, [file.tags, tmp.id])
      if (!tmp) {
        console.log("更新" + f + "出错！")
        return false
      }
    } else {
      return false
    }
    await db.close()
    return true
  } else {
    console.log("数据库出错")
    return false
  }
}

/**
 * 根据path删除指定多个文件夹-同步
 * @param folders 文件夹路径数组 f:{path:""}
 * @return 无返回值
 */
async function deleteFilesByPath(fpaths) {
  var db = await getDb()
  if (db) {
    for (var f of fpaths) {
      var sql = "delete from files where path=?"
      var rs = await db.run(sql, f)
      if (rs) console.log("成功删除" + f)
    }
  }
  await db.close()
}

/**
 * 根据id删除指定多个文件夹-同步
 * @param folders 文件夹路径数组 f:{path:""}
 * @return 无返回值
 */
async function deleteFilesById(ids) {
  var db = await getDb()
  if (db) {
    for (var id of ids) {
      var sql = "delete from files where id=?"
      var rs = await db.run(sql, id)
      if (rs) console.log("成功删除" + id)
    }
  }
  await db.close()
}


/**
 * 根据father删除指定多个文件夹-同步
 * @param folders 文件夹路径数组 f:{path:""}
 * @return 无返回值
 */
async function deleteFilesByFather(fathers) {
  var db = await getDb()
  if (db) {
    for (var id of fathers) {
      var sql = "delete from files where father=?"
      var rs = await db.run(sql, id)
      if (rs) console.log("成功删除" + f)
    }
  }
  await db.close()
}

/**
 * 根据路径获取文件(夹) - 同步
 * @return 一行数据或null
 */
async function getFileByPath(fpath) {
  var db = await getDb()
  if (db) {
    var sql = "select * from files where path = ?"
    var rs = await db.get(sql, fpath)
    await db.close()
    return rs
  }
  return null
}


/**
 * 根据路径删除文件夹及其中一级子文件
 * @return  成功返回删除数量  失败返回null
 */
async function deleteFoldersByPath(fpaths) {
  var db = await getDb()
  if (db) {
    var count = 0
    for (var fpath of fpaths) {
      var sql = "delete from files where father = (\
            select id from files where path = ?)"
      var rs = await db.run(sql, fpath)
      sql = "delete from files where path = ?"
      rs = await db.run(sql, fpath)
      if (rs) count += 1
    }
    await db.close()
    return count
  }
  return null
}

/**
 * 根据路径删除文件夹及其全部子文件
 * @return  成功返回删除数量  失败返回null
 */
async function deleteFoldersAllByPath(fpaths) {
  var db = await getDb()
  if (db) {
    var count = 0
    for (var fpath of fpaths) {
      //var repx = '^' + fpath + '(\\S)*'
      var repx = fpath + '%'
      var sql = "delete from files where path like ?"
      var rs = await db.run(sql, repx)
    }
    await db.close()
    return true
  }
  return null
}

/**
 * 根据father获取全部文件 
 * @param father --id
 * @return 数据库中folders表中全部数据
 */
async function getFilesByFather(father) {
  var db = await getDb()
  if (db) {
    var sql = "select * from files where father = ?"
    var rs = await db.all(sql, father)
    await db.close()
    return rs
  }
  return null
}

/**
 * 根据path批量获取全部文件 
 * @param fpaths 路径数组
 * @return 全部数据
 */
async function getFilesByPaths(fpaths) {
  var db = await getDb()
  if (db) {
    var results =[]
    for(var fpath of fpaths){
      var sql = "select * from files where path = ?"
      var rs = await db.get(sql, fpath)
      if(rs!=null||rs!=undefined)
          results.push(rs)
    }
    await db.close()
    return results
  }
  return null
}

/**
 * 根据tags搜索全部符合的文件
 * @return []
*/
async function getFilesByTags(tags) {
  var db = await getDb()
  if (db) {
    var sql = "select * from files where"
    var params = []
    for (var tag of tags) {
      sql = sql + " tags like ? or "
      params.push("%" + tag + "%")
    }
    sql = sql + "1>1"
    var rs = await db.all(sql, params)
    await db.close()
    return rs
  }
  return null
}

/**
 * 根据tags搜索指定文件夹列表内的符合的文件
 * @return []
 */
async function getFilesByTagsAndFolders(tags,folders) {
  var db = await getDb()
  if (db) {
    var sql = "select * from files where"
    var params = []
    for (var tag of tags) {
      sql = sql + " (tags like ? or "
      params.push("%" + tag + "%")
    }
    sql = sql + " 1>1 )"
    if(folders!=null&&folders.length>0){
      sql = sql + " and father in( select id from files where"
      for(var folder of folders){
          sql += " path like ? or "
          params.push(folder+"%")
      }
      sql += " 1>1)"
    }
    var rs = await db.all(sql, params)
    await db.close()
    return rs
  }
  return null
}

/**
 * 根据father获取全部文件 - 同步
 * @return 数据库中folders表中全部数据
 */
async function getAll() {
  var db = await getDb()
  if (db) {
    var sql = "select * from files"
    var rs = await db.all(sql)
    await db.close()
    return rs
  }
  return null
}


/**
 * 删除全部数据
*/
async function clearAll() {
  var db = await getDb()
  if (db) {
    var sql = "delete from files"
    var rs = await db.all(sql)
    await db.close()
    return rs
  }
  return null
}

/**
 * 根据文件夹路径获取全部子文件
 * @param fpath - 文件夹路径
 * @return rs - 失败返回null成功返回[{path:}]
*/
async function getChildrenByPath(fpath) {
  var db = await getDb()
  if (db) {
    var sql = "select * from files where father in (\
            select id from files where path=?)"
    var rs = await db.all(sql, fpath)
    await db.close()
    return rs
  }
  return null
}

//=====================================

module.exports.getDb = getDb
module.exports.addFiles = addFiles
module.exports.addFilesByFatherId = addFilesByFatherId

module.exports.getFileByPath = getFileByPath
module.exports.getChildrenByPath = getChildrenByPath
module.exports.getFilesByFather = getFilesByFather
module.exports.getFilesByTags = getFilesByTags
module.exports.getFilesByPaths = getFilesByPaths
module.exports.getFilesByTagsAndFolders = getFilesByTagsAndFolders
module.exports.getAll = getAll

module.exports.updateTags = updateTags
module.exports.updateFiles = updateFiles
module.exports.deleteFilesByPath = deleteFilesByPath
module.exports.deleteFilesById = deleteFilesById
module.exports.deleteFilesByFather = deleteFilesByFather
module.exports.deleteFoldersByPath = deleteFoldersByPath
module.exports.deleteFoldersAllByPath = deleteFoldersAllByPath
module.exports.clearAll = clearAll

