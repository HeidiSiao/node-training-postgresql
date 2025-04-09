const express = require("express");
const router = express.Router();

const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");
const handleErrorAsync = require ("../utils/handleErrorAsync");
const adminController  = require("../controllers/admin");



// 注意此路由要放上面，否則無法進入該路徑
// POST 新增教練課程資料
router.post("/coaches/courses", isAuth, isCoach, handleErrorAsync(adminController.postCoachCourse));

// PUT 編輯教練課程資料
router.put("/coaches/courses/:courseId", isAuth, isCoach, handleErrorAsync(adminController.putCoachCourse));

// POST 將使用者新增為教練
router.post("/coaches/:userId", handleErrorAsync(adminController.postCoach));

module.exports = router;
