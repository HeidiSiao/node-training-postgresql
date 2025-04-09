const express = require("express");
const router = express.Router();

const isAuth = require("../middlewares/isAuth");
const handleErrorAsync = require ("../utils/handleErrorAsync");
const coursesController = require ("../controllers/courses");

// GET 取得課程列表
// 要先去POST Course 改 skill_id
router.get("/", handleErrorAsync(coursesController.getCourses));

// 報名課程
router.post("/:courseId", isAuth,handleErrorAsync(coursesController.postCourse));

// 取消報名
router.delete('/:courseId', isAuth, handleErrorAsync(coursesController.deleteCourse));

module.exports = router;














