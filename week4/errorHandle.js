const errorHandle = (res, statusCode, statusMsg, errorMsg) => {
  const headers = {
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
    "Content-Type": "application/json",
  };

  res.writeHead(statusCode, headers);
  res.write(
    JSON.stringify({
      status: statusMsg,
      message: errorMsg,
    })
  );
  res.end();
};

module.exports = errorHandle;
