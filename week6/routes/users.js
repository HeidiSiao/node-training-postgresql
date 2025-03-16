const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("User");
const { userFieldCheck, loginFieldCheck,  pwdRuleCheck, nameRuleCheck } = require("../utils/validUtils");
const { customErr, correctRes } = require("../utils/resHandle");
const { generateJWT } = require("../utils/jwtService");
const isAuth = require("../middlewares/isAuth");
const handleErrorAsync = require ("../utils/handleErrorAsync");


// POST 使用者註冊
router.post("/signup", handleErrorAsync(async (req, res, next) => {
  // 接收註冊資料
  const data = req.body;
  const { name, email, password } = data;

  // 驗證必填欄位
  const invalidMsg = userFieldCheck(data);
  if (invalidMsg.length > 0) {
    logger.warn("必填欄位未填寫正確");
    throw customErr(400,`欄位未填寫正確: ${invalidMsg}`);
  }

  // 同時驗證密碼、姓名規則
  const invalidName =  nameRuleCheck (name);
  const invalidPwd = pwdRuleCheck(password);
  const err = [];
  if(invalidName) err.push(invalidName);
  if(invalidPwd) err.push(invalidPwd);
  if (err.length > 0) {
    const errMsg = err.join("|");
    logger.warn(`欄位未填寫正確: ${errMsg}`);
    throw customErr(400,`欄位未填寫正確: ${errMsg}`);
  };

  // email是否與查詢資料庫結果重複
  const userRepo = dataSource.getRepository("User");
  const userRecord = await userRepo.findOneBy({ email });
  if (userRecord) {
    logger.warn("建立使用者錯誤: Email 已被使用");
    throw customErr(409, "Email已被使用","conflict");
  }

  // 確認通過所有檢驗，建立新使用者資訊並儲存在資料庫
  const saltRounds = 10;
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
}));

// POST 使用者登入
router.post("/login", handleErrorAsync(async (req, res, next ) => {
  const { email, password } = req.body;
  const invalidMsg = loginFieldCheck(email, password);

  // 必填欄位驗證
  if (invalidMsg.length > 0) {
    logger.warn("必填欄位未填寫正確");
    throw customErr(400, `必填欄位未填寫正確：${invalidMsg}`);
  }
  // 密碼欄位規則驗證
  const isValidPwd = pwdRuleCheck(password);
  if (isValidPwd) {
    logger.warn(isValidPwd);
    throw customErr(400, `必填欄位未填寫正確：${isValidPwd}`);
  };

  // 先檢查email是否存在，撈出指定欄位
  const userRepo = dataSource.getRepository('User');
  const userRecord = await userRepo.findOne({
    select:['id','name','password'],
    where: { email }
  });

  if (!userRecord) {
    logger.warn("使用者不存在");
    throw customErr(404, "使用者不存在");
  };

  // 再驗證密碼，bcrypt.compare()
  const isMatch = await bcrypt.compare(password, userRecord.password);
  if(!isMatch){
    logger.warn("密碼輸入錯誤");
    throw customErr(401, "密碼輸入錯誤","Unauthorized");
  }
  
  // 登入成功，回傳JWT token給使用者
  const token = generateJWT({
    id: userRecord.id,
    role: userRecord.role
  });

  const dataRes = {
    token: token,
    user: {
      name: userRecord.name
    } 
  };

  correctRes(res, dataRes, 201);
}));

// GET 取得個人資料
router.get("/profile", isAuth, handleErrorAsync(async (req,res,next) => {
  
  // body內沒有物件，已存放在req.user
  // isAuth 已經確保了 id 的有效性
  const { id } = req.user;
  const userRecord = await dataSource.getRepository("User")
  .findOne ({
    select: ['email','name'],
    where: { id }
  });

  const dataRes = {
    user: userRecord
  }
  correctRes(res, dataRes, 200);

}));

// PUT 更新個人資料 (要token權限)
router.put("/profile", isAuth, handleErrorAsync(async (req,res,next) => {
  const { id } = req.user;
    const { name } = req.body;
    const invalidMsg = nameRuleCheck(name);
    if (invalidMsg) {
      logger.warn(`欄位未填寫正確: ${invalidMsg}`);
      throw customErr(400, `欄位未填寫正確：${invalidMsg}`);
    };

    // 檢查使用者名稱是否有修改，沒修改的話不需要更新資料庫
    const userRepo = dataSource.getRepository("User");
    const userRecord = await userRepo.findOneBy({ id });
    if (userRecord.name === name ) {
      logger.warn("使用者名稱未變更");
      throw customErr(400, "使用者名稱未變更");
    };

    // 確認使用者有修改，資料庫進行更新
    const updatedUser = await userRepo.update(
    // 條件先放，再更新的欄位
       { id }, { name }
    );

    // 資料庫是否成功更新
    if (updatedUser.affected === 0 ) {
      logger.warn("更新使用者失敗");
      throw customErr(400, "更新使用者失敗");
    };

    correctRes(res);
}));




module.exports = router;
















