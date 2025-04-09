const express = require("express");
const router = express.Router();

const isAuth = require("../middlewares/isAuth");
const handleErrorAsync = require ("../utils/handleErrorAsync");
const creditPackagesController = require ("../controllers/creditPackage");

// GET 取得購買方案列表
router.get("/", handleErrorAsync(creditPackagesController.getPricingPlans));

// POST 新增購買方案
router.post("/", handleErrorAsync(creditPackagesController.postPricingPlans));

// POST 新增使用者購買方案
// 登入後(isAuth)才能買其中的組合包
router.post("/:creditPackageId",isAuth, handleErrorAsync(creditPackagesController.postUserPlan));


// DELETE 刪除購買方案
router.delete("/:creditPackageId", handleErrorAsync(creditPackagesController.deletePlan));

module.exports = router;
