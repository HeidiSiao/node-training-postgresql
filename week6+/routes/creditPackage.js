const express = require("express");
const router = express.Router();

const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("CreditPackage");
const { packageFieldsCheck } = require("../utils/validUtils");
const { customErr, correctRes } = require("../utils/resHandle");
const { isUUID } = require("validator");
const isAuth = require("../middlewares/isAuth");
const handleErrorAsync = require ("../utils/handleErrorAsync");

// GET 取得購買方案列表
router.get("/", handleErrorAsync(async (req, res, next) => {
  const packages = await dataSource.getRepository("CreditPackage").find({
    select: ["id", "name", "credit_amount", "price"],
  });
  correctRes(res, packages);
}));

// POST 新增購買方案
router.post("/", handleErrorAsync(async (req, res, next) => {

  // 保留未解構的 data 變數是必要的
  // 在需要對整個物件進行操作時，例如驗證或檢查欄位
  const data = req.body;
  const { name, credit_amount, price } = data;
  const invalidResult = packageFieldsCheck(data).filter(
    (field) => field.isInvalid
  );

  if (invalidResult.length > 0) {
    const invalidMsg = invalidResult.map((field) => field.message);

    throw customErr(
      400,
      `欄位未填寫正確: ${invalidMsg.join(", ")}`
    );
  }

  const creditPackageRepo = dataSource.getRepository("CreditPackage");
  const packageRecord = await creditPackageRepo.findOne({
    where: { name },
  });
  if (packageRecord) {
    throw customErr(409, "資料重複","conflict");
  }

  const newPackage = creditPackageRepo.create({
    name,
    credit_amount,
    price,
  });
  const savedPackage = await creditPackageRepo.save(newPackage);
  correctRes(res, savedPackage);
}));

// POST 新增使用者購買方案
// 登入後(isAuth)才能買其中的組合包
router.post("/:creditPackageId",isAuth, handleErrorAsync(async(req,res,next) => {
  // 中介層從JWT中提取並驗證使用者資訊，並存放在 req.user 中
  // 獲取當前已驗證的使用者的 ID，確保後續操作的是該用戶自己的資料
  const { id } = req.user;
  // 某個特定資料的識別符
  const { creditPackageId } = req.params;
  const creditPackageRepo = dataSource.getRepository("CreditPackage");
  const creditPackageRecord = await creditPackageRepo.findOne({
    where: {
      id: creditPackageId
    }
  });
  
  // 確認外面進來的購買方案，是否與資料庫內已存在的紀錄，為同一個id
  if (!creditPackageRecord) {
    logger.warn("ID錯誤");
    throw customErr(400, "ID錯誤");
  };

  // 建立已成立的課程購買紀錄
  const creditPurchaseRepo = dataSource.getRepository("CreditPurchase");
  const newPurchase = creditPurchaseRepo.create({
    user_id: id,
    credit_package_id: creditPackageId,
    purchased_credits: creditPackageRecord.credit_amount,
    price_paid: creditPackageRecord.price,
    purchaseAt: new Date().toISOString()
  });
  const savedPurchase = await creditPurchaseRepo.save(newPurchase);

  // null 表示請求成功，但不回傳不必要的資訊，符合 RESTful API 設計指南
  correctRes(res, null, 201);
}));


// DELETE 刪除購買方案
router.delete("/:creditPackageId", handleErrorAsync(async (req, res, next) => {
  const { creditPackageId } = req.params;

  // 查找資料庫前，先確認是否為有效的 UUID 格式
  if (!isUUID(creditPackageId)) {
    throw customErr(400,"ID錯誤");
  }

  // 檢查資料庫是否確實刪除資料
  const deleteCount = await dataSource
    .getRepository("CreditPackage")
    .delete(creditPackageId);

  if (deleteCount.affected === 0) {
    throw customErr(404, "購買方案不存在");
  }
  correctRes(res, creditPackageId);
}));

module.exports = router;
