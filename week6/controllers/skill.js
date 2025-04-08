const { dataSource } = require("../db/data-source")
const logger = require("../utils/logger")("Skill");
const { skillFieldsCheck } = require("../utils/validUtils");
const { isUUID } = require("validator");
const { customErr, correctRes } = require("../utils/resHandle");

const skillController = {
  async getSkills (req,res,next) {
    const skills = await dataSource.getRepository("Skill").find({
      select: ["id", "name"],
    });
  
    correctRes(res, skills);
  }
}

module.exports = {
  skillController,
  
}




