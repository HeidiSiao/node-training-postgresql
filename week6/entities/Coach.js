const { EntitySchema, JoinColumn } = require("typeorm");

module.exports = new EntitySchema({
  name: "Coach",
  tableName: "COACH",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    user_id: {
      type: "uuid",
      unique: true,
      nullable: false,
    },
    experience_years: {
      type: "integer",
      nullable: false,
    },
    description: {
      type: "text",
      nullable: false,
    },
    profile_image_url: {
      type: "varchar",
      length: 2048,
      nullable: false,
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
  relations: {
    User: {
      target: "User",
      type: "one-to-one",
      inverseSide: "Coach", //雙向關聯 User 表中有一個關聯名稱叫 Coach
      joinColumn: {
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "coach_user_id_fk",
        //這個外鍵約束是指 標識 Coach 表的 user_id 連接到 User 表中 id 欄位
        //前者user_id是欄位定義，這邊是約束管理
      },
    },
  },
});
