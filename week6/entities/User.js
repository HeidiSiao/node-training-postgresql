const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "User", //ORM 內部識別名稱，定義和參考這個實體（Entity）
  tableName: "USER", //資料庫中的實際資料表名稱，ORM 會根據這個名稱去查詢或存取資料
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
      nullable: false,
    },
    name: {
      type: "varchar",
      length: 50,
      nullable: false,
      unique: true,
    },
    email: {
      type: "varchar",
      length: 320,
      nullable: false,
      unique: true,
    },
    role: {
      type: "varchar",
      length: 20,
      nullable: false,
    },
    password: {
      type: "varchar",
      length: 72,
      nullable: false,
      select: false, //該欄位預設不會被查詢出來
    },
    created_at: {
      type: "timestamp",
      createDate: true,
      nullable: false,
    },
    updated_at: {
      type: "timestamp",
      updateDate: true,
      nullable: false,
    },
  },
});
