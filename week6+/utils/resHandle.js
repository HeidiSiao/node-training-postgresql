// throw 錯誤可被 catch 塊捕獲，轉交全局錯誤處理 middleware
const customErr = (statusCode, message, status = "failed") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = status;
  return error;
};

const correctRes = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    status: "success",
    data: data,
  });
};

module.exports = { customErr, correctRes };
