const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("User");
const { userFieldCheck, userInfoRuleCheck } = require("../utils/validUtils");
const { customErr, correctRes } = require("../utils/resHandle");

const saltRounds = 10;

router.post("/signup", async (req, res, next) => {
  try {
    // 接收註冊資料
    const data = req.body;
    const { name, email, password } = data;

    // 驗證必填欄位
    const invalidMsg = userFieldCheck(data);
    if (invalidMsg.length > 0) {
      logger.warn("必填欄位未填寫正確");
      throw customErr(400, "failed", `欄位未填寫正確: ${invalidMsg}`);
    }

    // 驗證規則與欄位內容是否相符
    const userInfoValidResult = userInfoRuleCheck(name, password);
    if (userInfoValidResult.length > 0) {
      const message = userInfoValidResult.join(" | ");
      logger.warn(message);
      throw customErr(400, "failed", message);
    }

    // 驗證使用者姓名規則
    // if (!isValidUserName(name)) {
    //   logger.warn(
    //     "建立使用者錯誤: 姓名不符合規則，不可包含任何特殊符號與空白，最少2個字，最多10個字"
    //   );
    //   throw customErr(
    //     400,
    //     "failed",
    //     "姓名不符合規則，不可包含任何特殊符號與空白，最少2個字，最多10個字"
    //   );
    // }
    // 驗證密碼規則
    //  if (!isValidPassword(password)) {
    //   // 紀錄一條警告信息
    //   logger.warn(
    //     "建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
    //   );
    //   throw customErr(
    //     400,
    //     "failed",
    //     "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
    //   );
    // }

    // email是否與查詢資料庫結果重複
    const userRepo = dataSource.getRepository("User");
    const userRecord = await userRepo.findOne({
      where: { email },
    });
    if (userRecord) {
      logger.warn("建立使用者錯誤: Email 已被使用");
      throw customErr(409, "failed", "Email已被使用");
    }

    // 確認通過所有檢驗，建立新使用者資訊並儲存在資料庫
    const hashPassword = await bcrypt.hash(password, saltRounds);
    const newUser = userRepo.create({
      name,
      email,
      role: "USER",
      password: hashPassword,
    });
    const savedUser = await userRepo.save(newUser);
    logger.info("新建立的使用者ID:", savedUser.id);

    // 包含敏感資訊，放入data物件前要先篩選過！
    const filteredUserRes = {
      user: {
        id: savedUser.id,
        name: savedUser.name,
      },
    };

    correctRes(res, filteredUserRes, 201);
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

module.exports = router;
