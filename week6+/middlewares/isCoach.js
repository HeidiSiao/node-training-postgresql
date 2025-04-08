const { customErr } = require("../utils/resHandle");

const isCoach = (req, res, next) => {
  if(!req.user || req.user.role !== 'COACH') {
    throw customErr(403,"使用者尚未成為教練，沒有權限訪問","forbidden");
  }
  next()
}

module.exports = isCoach;