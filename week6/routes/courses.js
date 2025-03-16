const express = require("express");
const router = express.Router();

const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Coach");
const {  } = require("../utils/validUtils");
const { customErr, correctRes } = require("../utils/resHandle");
const handleErrorAsync = require ("../utils/handleErrorAsync");

// GET 取得課程列表
router.get("/", handleErrorAsync(async(req,res,next) => {
  const coursesRepo = dataSource.getRepository("Course");
  const coursesRecord = coursesRepo.findOne({
    where: {
      
    }
  })

}));


module.exports = router;