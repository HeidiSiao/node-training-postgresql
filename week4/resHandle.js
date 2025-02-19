const headers = {
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Content-Length, X-Requested-With",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
  "Content-Type": "application/json",
};

const errorRes = (res, statusCode, status, message) => {
  res.writeHead(statusCode, headers);
  res.write(
    JSON.stringify({
      status: status,
      message: message,
    })
  );
  res.end();
};

const correctRes = (res, data) => {
  res.writeHead(200, headers);
  res.write(
    JSON.stringify({
      status: "success",
      data: data,
    })
  );
  res.end();
};

module.exports = { errorRes, correctRes };
