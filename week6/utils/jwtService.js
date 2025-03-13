const jwt = require('jsonwebtoken');
const config = require('../config/index');
const { customErr, correctRes } = require("./resHandle");

const generateJWT = (payload) => {
  // 產生JWT token 
  return jwt.sign(
    payload,
    config.get('secret.jwtSecret'),
    { expiresIn: config.get('secret.jwtExpiresDay') }
  );
}

// 驗證JWT
const verifyJWT = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.get('secret.jwtSecret'), (err, decoded) => {
      if (err) {
        // reject(err)
        if (err.name === "TokenExpiredError") {
          throw customErr(401,"Token 已過期","Unauthorized");
        }
        throw customErr(401,"無效的 token","Unauthorized");
        /* switch (err.name) {
          case 'TokenExpiredError':
          reject(appError(401, 'Token 已過期'))
          break
          default:
          reject(appError(401, '無效的 token'))
          break
        } */ 
        } else {
        resolve(decoded)
      }
    })
  })
}




module.exports = { generateJWT, verifyJWT };