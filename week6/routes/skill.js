const express = require("express");
const router = express.Router();

const { dataSource } = require("../db/data-source");
// 呼叫 getLogger 函式，並傳入 'Skill' 作為 prefix（前綴標籤）
const logger = require("../utils/logger")("Skill");
const { skillFieldsCheck } = require("../utils/validUtils");
const { customErr, correctRes } = require("../utils/resHandle");
const { isUUID } = require("validator");

router.get("/", async (req, res, next) => {
  try {
    const skills = await dataSource.getRepository("Skill").find({
      select: ["id", "name"],
    });
    // correctRes(res, skills);
    res.status(200).json({
      status: "success",
      data: skills,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body;
    const invalidMsg = skillFieldsCheck(name);

    if (invalidMsg.isInvalid) {
      throw customErr(400, "failed", `欄位未填寫正確: ${invalidMsg.message}`);
    }

    const skillRepo = dataSource.getRepository("Skill");
    const skillRecord = await skillRepo.findOne({
      where: { name },
    });
    if (skillRecord) {
      throw customErr(409, "failed", "資料重複");
    }

    const newSkill = skillRepo.create({ name });
    const savedSkill = await skillRepo.save(newSkill);

    correctRes(res, 200, savedSkill);
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.delete("/:skillId", async (req, res, next) => {
  try {
    const { skillId } = req.params;
    if (!isUUID(skillId)) {
      throw customErr(400, "failed", "ID錯誤");
    }
    // 無法確實刪除該筆資料 = 格式正確但 資料庫找不到該ID
    // 或 關聯教練正在使用該項技能，所以不能被刪除 (422 業務邏輯問題？)
    const deleteCount = await dataSource.getRepository("Skill").delete(skillId);
    if (deleteCount.affected === 0) {
      console.log(deleteCount);
      throw customErr(404, "failed", "ID不存在");
    }

    correctRes(res, 200, skillId);
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

module.exports = router;
