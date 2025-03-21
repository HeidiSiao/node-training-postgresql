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
    // decoded.id 只是從 JWT 解析出來的值，後續使用不代表此 ID 在資料庫中一定存在
    const fetchedUser = await dataSource.getRepository('User')
    .findOneBy({ id: decoded.id });

    // 防止已刪除或停用的帳號仍能操作
    if (!fetchedUser) {
      throw customErr(401,"無效的 token","Unauthorized");
    };
  
    // 登入成功，把user物件存到req.user下
    // 呼叫 next() 讓後續的 middleware Route 可以使用 req.user
    req.user = fetchedUser
    next();
  } catch (error) {
    logger.error(error.message)
    next(error)
  }
};

module.exports = isAuth