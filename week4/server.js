require("dotenv").config();
const http = require("http");
const AppDataSource = require("./db");
const { packageFieldsCheck, skillFieldsCheck } = require("./validator");
const errorHandle = require("./errorHandle");
const { isUUID } = require("validator"); // 引入 isUUID 方法

// const isUndefined = (value) => typeof value === "undefined";
// const isNotValidString = (value) =>
//   typeof value !== "string" || value.trim().length === 0;
// const isNotValidInteger = (value) =>
//   typeof value !== "number" || value < 0 || value % 1 !== 0;

const requestListener = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
    "Content-Type": "application/json",
  };

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  // GET 取得購買方案列表
  if (req.url === "/api/credit-package" && req.method === "GET") {
    try {
      const packages = await AppDataSource.getRepository("CreditPackage").find({
        select: ["id", "name", "credit_amount", "price"],
      });
      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
          data: packages,
        })
      );
      res.end();
    } catch (error) {
      errorHandle(res, 500, "error", "伺服器錯誤");
    }
  } // POST 新增購買方案
  else if (req.url === "/api/credit-package" && req.method === "POST") {
    req.on("end", async () => {
      console.log("接收到的資料：", body);
      console.log("資料長度：", body.length); // 打印資料的長度
      try {
        // 先存成data物件後續使用
        const data = JSON.parse(body);
        const { name, credit_amount, price } = data;

        //取得 驗證資料欄位是錯誤的欄位訊息
        const invalidResult = packageFieldsCheck(data).filter(
          (field) => field.isInvalid
        );
        const invalidMsg = invalidResult.map((field) => field.message);
        if (invalidResult.length > 0) {
          errorHandle(
            res,
            400,
            "failed",
            `欄位未填寫正確: ${invalidMsg.join(", ")}`
          );
          return;
        }
        // 資料庫查找指定的資料表需要時間是異步操作，並返回 Promise
        // await 讓程式暫停執行等待 Promise，直到 Promise 被解析並返回結果
        const creditPackageRepo = AppDataSource.getRepository("CreditPackage");
        const packageRecord = await creditPackageRepo.findOne({
          where: { name },
        });
        if (packageRecord) {
          errorHandle(res, 409, "failed", "資料重複");
          return;
        }

        // create 僅返回創建不涉及操作資料庫是同步操作
        // save 寫入資料庫是異步操作
        const newPackage = creditPackageRepo.create({
          name,
          credit_amount,
          price,
        });
        const savedPackage = await creditPackageRepo.save(newPackage);
        res.writeHead(200, headers);
        res.write(
          JSON.stringify({
            status: "success",
            data: savedPackage,
          })
        );
        res.end();
      } catch (error) {
        console.error(error);
        errorHandle(res, 500, "error", "伺服器錯誤");
      }
    });
  } // DELETE 刪除購買方案
  else if (
    req.url.startsWith("/api/credit-package/") &&
    req.method === "DELETE"
  ) {
    try {
      // 已過濾掉 空字串、多餘 /，但可能為非 id 的字串
      const urlPaths = req.url.split("/").filter((path) => path);
      const packageId = urlPaths[urlPaths.length - 1];

      // 查找資料庫前，要先確認是否為有效的 UUID 格式
      if (!isUUID(packageId)) {
        errorHandle(res, 400, "failed", "ID錯誤");
        return;
      }

      // id資料是否確實已存在(delete() 方法重疊)
      // const idRecord = await AppDataSource.getRepository(
      //   "CreditPackage"
      // ).findOne({
      //   where: {
      //     id: packageId,
      //   },
      // });
      // if (!idRecord) {
      //   errorHandle(res, 400, "failed", "ID錯誤");
      //   return;
      // }

      // 檢查資料庫是否確實刪除資料
      const deleteCount = await AppDataSource.getRepository(
        "CreditPackage"
      ).delete(packageId);

      if (deleteCount.affected === 0) {
        errorHandle(res, 400, "failed", "ID錯誤");
        return;
      }
      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
          data: packageId,
        })
      );
      res.end();
    } catch (error) {
      console.error(error);
      errorHandle(res, 500, "error", "伺服器錯誤");
    }
  } // GET 取得教練專長
  else if (req.url === "/api/coaches/skill" && req.method === "GET") {
    try {
      const skills = await AppDataSource.getRepository("Skill").find({
        select: ["id", "name"],
      });
      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
          data: skills,
        })
      );
      res.end();
    } catch (error) {
      errorHandle(res, 500, "error", "伺服器錯誤");
    }
  } // POST 新增教練專長
  else if (req.url === "/api/coaches/skill" && req.method === "POST") {
    req.on("end", async () => {
      console.log("已接收資料：", body);
      console.log("資料長度：", body.length); // 打印資料的長度
      try {
        const data = JSON.parse(body);
        const { name } = data;
        const invalidMsg = skillFieldsCheck({ name });

        if (invalidMsg.isInvalid) {
          errorHandle(
            res,
            400,
            "failed",
            `欄位未填寫正確: ${invalidMsg.message}`
          );
          return;
        }

        const skillRepo = AppDataSource.getRepository("Skill");
        const skillRecord = await skillRepo.findOne({
          where: { name },
        });
        if (skillRecord) {
          errorHandle(res, 409, "failed", "資料重複");
          return;
        }

        const newSkill = skillRepo.create({ name });
        const savedSkill = await skillRepo.save(newSkill);

        res.writeHead(200, headers);
        res.write(
          JSON.stringify({
            status: "success",
            data: savedSkill,
          })
        );
        res.end();
      } catch (error) {
        console.error(error);
        errorHandle(res, 500, "error", "伺服器錯誤");
      }
    });
  } // DELETE 刪除教練專長
  else if (
    req.url.startsWith("/api/coaches/skill/") &&
    req.method === "DELETE"
  ) {
    try {
      const skillId = req.url.split("/").pop();

      if (!isUUID(skillId)) {
        errorHandle(res, 400, "failed", "ID錯誤");
        return;
      }

      // 無法確實刪除該筆資料 = 格式正確但 資料庫找不到該ID
      // 或 關聯教練正在使用該項技能，所以不能被刪除 (422 業務邏輯問題？)
      const deleteCount = await AppDataSource.getRepository("Skill").delete(
        skillId
      );
      if (deleteCount.affected === 0) {
        console.log(deleteCount);
        errorHandle(res, 404, "failed", "找不到此ID");
        return;
      }
      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
          data: skillId,
        })
      );
      res.end();
    } catch (error) {
      errorHandle(res, 500, "error", "伺服器錯誤");
    }
  }
};

const server = http.createServer(requestListener);

async function startServer() {
  await AppDataSource.initialize();
  console.log("資料庫連接成功");
  server.listen(process.env.PORT);
  console.log(`伺服器啟動成功, port: ${process.env.PORT}`);
  return server;
}

module.exports = startServer();
