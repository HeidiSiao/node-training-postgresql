const { dataSource } = require('../db/data-source')
const { customErr } = require("../utils/resHandle");
const { verifyJWT } = require('../utils/jwtService')
const logger = require('../utils/logger')('isAuth')

const isAuth = async (req, res, next) => {
  try {
    // 前端-> Authorization: Bearer xxxxxxx.yyyyyyy.zzzzzzz
    // 驗證 token：標頭的Authorization有值、 'Bearer' 開頭
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      throw customErr(401,"你尚未登入！","Unauthorized");
    };
    // 取出token值 xxxxxxx.yyyyyyy.zzzzzzz
    const token = authHeader.split(' ')[1]

    // 驗證 token (取得 payload)
    const decoded = await verifyJWT(token)
    
    // 用payload中的id，在資料庫尋找對應id 
    const fetchedUser = await dataSource.getRepository('User')
    .findOneBy({ id: decoded.id });
    
    if (!fetchedUser) {
      throw customErr(401,"無效的 token","Unauthorized");
    };
  
    // 合法token，在 req 物件加入 user 欄位
    req.user = fetchedUser

    next();
  } catch (error) {
    logger.error(error.message)
    next(error)
  }
};

module.exports = isAuth