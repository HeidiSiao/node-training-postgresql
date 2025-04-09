const express = require("express");
const router = express.Router();

const isAuth = require("../middlewares/isAuth");
const handleErrorAsync = require ("../utils/handleErrorAsync");
const usersController = require ("../controllers/users");

// POST 使用者註冊
router.post("/signup", handleErrorAsync(usersController.postSignup));

// POST 使用者登入
router.post("/login", handleErrorAsync(usersController.postLogin));

// GET 取得個人資料
router.get("/profile", isAuth, handleErrorAsync(usersController.getPersonalInfo));

// PUT 更新個人資料 (要token權限)
router.put("/profile", isAuth, handleErrorAsync(usersController.putPersonalInfo));




module.exports = router;
















