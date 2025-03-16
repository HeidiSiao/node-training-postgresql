const express = require("express");
const router = express.Router();

const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("CreditPackage");
const { packageFieldsCheck } = require("../utils/validUtils");
const { customErr, correctRes } = require("../utils/resHandle");
const { isUUID } = require("validator");
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
