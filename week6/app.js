const express = require("express");
const cors = require("cors");
const path = require("path");
const pinoHttp = require("pino-http");

const logger = require("./utils/logger")("App");

const creditPackageRouter = require("./routes/creditPackage");
const skillRouter = require("./routes/skill");
const userRouter = require("./routes/users");
const adminRouter = require("./routes/admin");
const coachesRouter = require("./routes/coaches");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        req.body = req.raw.body;
        return req;
      },
    },
  })
);
app.use(express.static(path.join(__dirname, "public")));

const { dataSource } = require("./db/data-source");

app.use("/api/credit-package", creditPackageRouter);
app.use("/api/coaches/skill", skillRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/coaches", coachesRouter);

// Express 會自動結束請求，所以不用return 
app.use((req, res, next)=>{
  res.status(404).json({
    status: "error",
    message:"無此路由"
  })
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  req.log.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: err.status || (statusCode === 500 ? "error" : "failed"),
    message: err.message || "伺服器發生錯誤"
  });
});

// 設置健康檢查路由，要在伺服器on起來前
app.get("/healthCheck", (req, res) => {
  res.status(200).send("OK");
});

// 負責初始化資料庫連接，確保應用程式能夠與資料庫正常通訊
const startServer = async () => {
  try {
    console.log("Initializing Data Source...");
    await dataSource.initialize(); // 等待資料庫初始化
    console.log("Data Source has been initialized!");
  } catch (error) {
    console.error("Error during Data Source initialization:", error);
    process.exit(1); // 強制終止程式
  }
};
startServer();

module.exports = app;

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   logger.info(`伺服器運行中: http://localhost:${PORT}`);
// });



