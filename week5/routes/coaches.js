const express = require("express");
const router = express.Router();

const { dataSource } = require("../db/data-source");
// 立即執行函式並傳入 "Coach" 作為參數
// 工廠函式的設計模式，目的是讓每個模組都能有自己獨立的 logger
const logger = require("../utils/logger")("Coach");
const { isUUID } = require("validator");
const { coachesQueryCheck } = require("../utils/validUtils");
const { customErr, correctRes } = require("../utils/resHandle");


//根據 per（每頁顯示的資料筆數）和 page（頁碼）計算需要顯示的資料範圍
router.get("/", async (req, res, next) => {
  try {
    // per 和 page 字串後續需要進行轉換成數字
    let { per, page } = req.query;
    const invalidMsg = coachesQueryCheck(per, page);
    // req.query 取得的值本來就是字串，確認是否為數字
    if (invalidMsg) {
      logger.warn(invalidMsg);
      throw customErr(400, "failed", `${invalidMsg}`);
    }
    // 將 per 和 page 轉換為正整數
    per = parseInt(per);
    page = parseInt(page);

    const coachesRepo = dataSource.getRepository("Coach");
    const coachesRecord = await coachesRepo.find({
      select: {
        id: true, //Coach表id
        User: {
          name: true,
        },
      },
      // 控制回傳資料的數量，取出資料範圍讓前端進行分頁查詢
      take: per, // 每次只取 per 筆
      skip: (page - 1) * per, // 跳過前X筆資料，然後再拿X筆
      // 要取得User物件就需要relations
      relations: {
        User: true,
      },
    });
    // 將資料做格式化，只保留 id 和 User 表的 name 且不會暴露 User 物件的其它內容
    // ({ }) 創建物件，對每個 coach 物件進行的映射操作，返回 id 和 name 屬性
    const coachesList = coachesRecord.map((coach) => ({
      id: coach.id, // 取出每個教練的id
      name: coach.User.name,
    }));
    correctRes(res, coachesList);
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.get("/:coachId", async(req,res,next) => {
  try {
    const { coachId } = req.params;
    // 確認是否為有效ID格式
    if(!isUUID(coachId)){
      logger.warn("欄位未填寫正確:ID錯誤");
      throw customErr(400, "failed", "欄位未填寫正確:ID錯誤");
    };

    // 查找coach表是否有此教練ID，findOneBy 支援單一物件條件
    // 撈出user表的name,role 再一併回傳data，findOne 載入關聯/OR條件
    // 因為關聯可以一次性載入 Coach 和 User 的資料
    const coachesRepo = dataSource.getRepository("Coach");
    const coachRecord = await coachesRepo.findOne({ 
      where:{ id: coachId },
      relations: ["User"] //自動載入與加入 user 物件
    });
    if(!coachRecord) {
      logger.warn("找不到該教練");
      throw customErr(404, "failed", "找不到該教練");
    }
    const { name, role } = coachRecord.User;

    const dataRes = {
      user: {name, role},
      coach: coachRecord
    };
    correctRes(res, dataRes);
  } catch(error) {
    logger.error(error);
    next(error);
  }
});


module.exports = router;
