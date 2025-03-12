// const errorRes = (res, statusCode, status, message) => {
//   res.status(statusCode).json({
//     status: status,
//     message: message,
//   });
// };

// 錯誤可被 catch 塊捕獲，轉交全局錯誤處理 middleware
const customErr = (statusCode, status, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = status;
  return error;
};

// correctRes(res, undefined, packages); 可以
// correctRes(res, 203,packages); 可以
// correctRes(res); 可以
// const correctRes = (res, statusCode = 200, data) => {
//   res.status(statusCode).json({
//     status: "success",
//     data: data,
//   });
// };

// 單一預設值放最後！！！
// correctRes(res, 203, packages); 不可以
// correctRes(res, undefined, packages); 不可以
// correctRes(res, packages, 203); 可以
// correctRes(res, packages); 可以
// correctRes(res, packages, undefined); 可以
const correctRes = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    status: "success",
    data: data,
  });
};

module.exports = { customErr, correctRes };
