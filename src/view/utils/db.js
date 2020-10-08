const Sql = require('sqlite3')
const path = require('path')
const DB_PATH = path.resolve("./", "tagfile.db")

const CREATETABLE_FOLDERS = "create table folders(path varchar(320) primary key)"
const CREATETABLE_TAGS = "create table tags(path varchar(320) primary,tags varchar(100))"

var DB = DB ||{}

DB.db = new sql.Database(DB_PATH)