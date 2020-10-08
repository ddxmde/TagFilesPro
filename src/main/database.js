
const fs = require('fs')
const sqlite = require('sqlite3')


class DB {
  constructor(path, init_tables) {
    //this.instance
    this.db = null
    this.db_name = path
    this.statement = null
    this.init_tables = init_tables
  }
  static getInstance(path, init_tables = INIT_TABLES) {
    //var _that = this
    //console.log("进入getInstance")
    return new Promise((resolve, rejceted) => {
      if (!fs.existsSync(path)) {
        //数据库不存在
        //console.log("数据库丢失")
        fs.writeFile(path, "", 'utf8', (err) => {
          if (err) {
            resolve(null)
          } else {
            var tmp_db = new DB(path, init_tables)
            //console.log("数据库创建,返回" + tmp_db)
            resolve(tmp_db)
          }
        })
      } else {
        var tmp_db = new DB(path, null)
        //console.log("数据库存在,返回" + tmp_db)
        resolve(tmp_db)
      }
    })
  }
  connect(path = this.db_name) {
    var _that = this
    //console.log(_that.db_name)
    return new Promise((resolve, reject) => {
      _that.db = new sqlite.Database(path, (err) => {
        if (err === null) {
          //console.log("新建db"+_that.db)
          _that.db.run('PRAGMA busy_timeout = 6000');
          _that.db.configure("busyTimeout", 6000);
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }
  close() {
    var _that = this
    return new Promise((resolve, rejceted) => {
      if (_that.statement) {
        _that.statement.finalize(() => {
          _that.statement = null
          _that.db.close((err) => {
            if (err) console.log("关闭出错" + err)
            else {
              _that.db = null
              //console.log("关闭数据库")
              resolve(true)
            }
          })
          //console.log("关闭数据库" + _that.db)
        })
      } else {
        _that.db.close((err) => {
          if (err) console.log("关闭出错" + err)
          else {
            _that.db = null
            //console.log("关闭数据库")
            resolve(true)
          }
        })
        //console.log("关闭数据库" + _that.db)
      }
    })
  }

  get(sql, args) {
    var _that = this
    return new Promise((resolve, rejceted) => {
      _that.statement = _that.db.prepare(sql, args)
      _that.statement.get((err, row) => {
        if (err == null) {
          //console.log("get函数结果"+row)
          resolve(row)
        } else {
          //console.log("报错"+err)
          resolve(null)
        }
      }).finalize(() => {
        _that.statement = null
      })
    })
  }

  //运行sql 成功返回true 失败返回false
  run(sql, args) {
    var _that = this
    return new Promise((resolve, reject) => {
      _that.statement = _that.db.prepare(sql, args)
      _that.statement.run((err) => {
        if (err === null) {
          resolve(true)
        } else {
          console.log(err)
          resolve(false)
        }
      }).finalize(() => {
        _that.statement = null
      })
    })
  }

  //运行sql带返回值
  all(sql, args) {
    var _that = this
    return new Promise((resolve, rejceted) => {
      _that.statement = _that.db.prepare(sql, args)
      _that.statement.all((err, rows) => {
        if (rows)
          resolve(rows)
        else
          resolve(null)
      }).finalize(() => {
        _that.statement = null
      })
    })
  }
}

exports.DB = DB //ES5
//export default DB  //ES6