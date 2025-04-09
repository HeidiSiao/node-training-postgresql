const express = require("express");
const router = express.Router();

const handleErrorAsync = require ("../utils/handleErrorAsync");
const coachesController = require ("../controllers/coaches");

// GET 取得教練列表
router.get("/", handleErrorAsync(coachesController.getCoaches));

// GET 取得教練詳細資訊
router.get("/:coachId", handleErrorAsync(coachesController.getCoachesDetails));

module.exports = router;
// 要新增使用者>教練角色>新增skill/教練課程>才可以查詢coaches得到coaches的id
// coach id !== user id