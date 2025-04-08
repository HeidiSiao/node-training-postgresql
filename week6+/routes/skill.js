const express = require("express");
const router = express.Router();

const { dataSource } = require("../db/data-source");
const handleErrorAsync = require ("../utils/handleErrorAsync");
const skillController  = require("../controllers/skill") 

// GET 取得教練專長列表
router.get("/", handleErrorAsync(skillController.getSkills));

// POST 新增教練專長
router.post("/", handleErrorAsync(skillController.postSkill));

// DELETE 刪除教練專長
router.delete("/:skillId", handleErrorAsync(skillController.deleteSkill));

module.exports = router;
