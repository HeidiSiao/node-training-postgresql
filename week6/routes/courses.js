const express = require("express");
const router = express.Router();

const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Coach");
const {  } = require("../utils/validUtils");
const { customErr, correctRes } = require("../utils/resHandle");
const handleErrorAsync = require ("../utils/handleErrorAsync");
const Skill = require("../entities/Skill");

// GET 取得課程列表
router.get("/", handleErrorAsync(async(req,res,next) => {
  const coursesRepo = dataSource.getRepository("Course");
  // find()方法會返回查詢結果的陣列
  // 資料庫取得包含多筆課程資料的陣列
  const coursesRecord = await coursesRepo.find({
    select: {
      id: true,
      // 選擇關聯表中的 name 欄位
      User: { name: true },
      Skill: { name: true },
      name: true,
      description: true,
      start_at: true,
      end_at: true,
      max_participants: true
    },
    // 直接載入整個 User 和 Skill 物件
    relations: ["User", "Skill"]
  });

  // 直接回傳一個物件 ({ ... }) 陣列(map)
  // 資料結構調整原始嵌套在 User 和 Skill 物件的紀錄
  const courseTable = coursesRecord.map(record => ({
    id: record.id,
    coach_name: record.User.name,
    skill_name: record.Skill.name,
    name: record.name,
    description: record.description,
    start_at: record.start_at,
    end_at: record.end_at,
    max_participants: record.max_participants
  }));
  correctRes(res, courseTable);

}));


module.exports = router;