const { dataSource } = require("../db/data-source")
const logger = require("../utils/logger")("Skill");
const { skillFieldsCheck } = require("../utils/validUtils");
const { isUUID } = require("validator");
const { customErr, correctRes } = require("../utils/resHandle");

const skillController = {
  /* 用箭頭函式定義物件屬性方法，繼承外部this發生undefined的問題
  // getSkills: async (req,res,next) => {
  //   const skills = await dataSource.getRepository("Skill").find({
  //     select: ["id", "name"],
  //   });
  //   correctRes(res, skills);
  // }, 
  */

  // 使用常規函式內部定義方法，保持正確的this指向
  // GET 取得教練專長列表
  async getSkills (req,res,next) {
    const skills = await dataSource.getRepository("Skill").find({
      select: ["id", "name"],
    });
  
    correctRes(res, skills);
  },

  // POST 新增教練專長
  async postSkill (req, res, next) {
    const { name } = req.body;
    const invalidMsg = skillFieldsCheck(name);
  
    if (invalidMsg.isInvalid) {
      logger.warn(invalidMsg.message);
      throw customErr(400, `欄位未填寫正確: ${invalidMsg.message}`);
    }
  
    const skillRepo = dataSource.getRepository("Skill");
    const skillRecord = await skillRepo.findOne({
      where: { name },
    });
    if (skillRecord) {
      logger.warn("資料重複");
      throw customErr(409,"資料重複","conflict");
    }
  
    const newSkill = skillRepo.create({ name });
    const savedSkill = await skillRepo.save(newSkill);
    const fetchSkill = await skillRepo.findOne({
      select:["id","name"],
      where:{
        id: savedSkill.id
      }
    });
  
    correctRes(res, fetchSkill);
  },

  // DELETE 刪除教練專長
  async deleteSkill (req, res, next) {
    const { skillId } = req.params;
    if (!isUUID(skillId)) {
      throw customErr(400, "ID錯誤");
    }
    // 無法確實刪除該筆資料 = 格式正確但 資料庫找不到該ID
    // 或 關聯教練正在使用該項技能，所以不能被刪除 (422 業務邏輯問題？)
    const deleteCount = await dataSource.getRepository("Skill").delete(skillId);
    if (deleteCount.affected === 0) {
      console.log(deleteCount);
      throw customErr(404, "ID不存在");
    }
  
    correctRes(res, skillId);
  }
}

module.exports = skillController;




