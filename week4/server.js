require("dotenv").config();
const http = require("http");
const AppDataSource = require("./db");
const { packageFieldsCheck, skillFieldsCheck } = require("./validator");
const { errorRes, correctRes } = require("./resHandle");
const { isUUID } = require("validator"); // 引入 isUUID 方法

const requestListener = async (req, res) => {
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
      correctRes(res, packages);
    } catch (error) {
      console.error(error);
      errorRes(res, 500, "error", "伺服器錯誤");
    }
  } // POST 新增購買方案
  else if (req.url === "/api/credit-package" && req.method === "POST") {
    req.on("end", async () => {
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
          errorRes(
            res,
            400,
            "failed",
            `欄位未填寫正確: ${invalidMsg.join(", ")}`
          );
          return;
        }

        const creditPackageRepo = AppDataSource.getRepository("CreditPackage");
        const packageRecord = await creditPackageRepo.findOne({
          where: { name },
        });
        if (packageRecord) {
          errorRes(res, 409, "failed", "資料重複");
          return;
        }

        const newPackage = creditPackageRepo.create({
          name,
          credit_amount,
          price,
        });
        const savedPackage = await creditPackageRepo.save(newPackage);
        correctRes(res, savedPackage);
      } catch (error) {
        console.error(error);
        errorRes(res, 500, "error", "伺服器錯誤");
      }
    });
  } // DELETE 刪除購買方案
  else if (
    req.url.startsWith("/api/credit-package/") &&
    req.method === "DELETE"
  ) {
    try {
      // filter過濾任何 空字串、多餘/的 id字串
      const urlPaths = req.url.split("/").filter((path) => path);
      const packageId = urlPaths[urlPaths.length - 1];

      // 查找資料庫前，先確認是否為有效的 UUID 格式
      if (!isUUID(packageId)) {
        errorRes(res, 400, "failed", "ID錯誤");
        return;
      }

      // 檢查資料庫是否確實刪除資料
      const deleteCount = await AppDataSource.getRepository(
        "CreditPackage"
      ).delete(packageId);

      if (deleteCount.affected === 0) {
        errorRes(res, 404, "failed", "ID不存在");
        return;
      }
      correctRes(res, packageId);
    } catch (error) {
      console.error(error);
      errorRes(res, 500, "error", "伺服器錯誤");
    }
  } // GET 取得教練專長
  else if (req.url === "/api/coaches/skill" && req.method === "GET") {
    try {
      const skills = await AppDataSource.getRepository("Skill").find({
        select: ["id", "name"],
      });
      correctRes(res, skills);
    } catch (error) {
      errorRes(res, 500, "error", "伺服器錯誤");
    }
  } // POST 新增教練專長
  else if (req.url === "/api/coaches/skill" && req.method === "POST") {
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const { name } = data;
        const invalidMsg = skillFieldsCheck({ name });

        if (invalidMsg.isInvalid) {
          errorRes(res, 400, "failed", `欄位未填寫正確: ${invalidMsg.message}`);
          return;
        }

        const skillRepo = AppDataSource.getRepository("Skill");
        const skillRecord = await skillRepo.findOne({
          where: { name },
        });
        if (skillRecord) {
          errorRes(res, 409, "failed", "資料重複");
          return;
        }

        const newSkill = skillRepo.create({ name });
        const savedSkill = await skillRepo.save(newSkill);
        correctRes(res, savedSkill);
      } catch (error) {
        console.error(error);
        errorRes(res, 500, "error", "伺服器錯誤");
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
        errorRes(res, 400, "failed", "ID錯誤");
        return;
      }

      // 無法確實刪除該筆資料 = 格式正確但 資料庫找不到該ID
      // 或 關聯教練正在使用該項技能，所以不能被刪除 (422 業務邏輯問題？)
      const deleteCount = await AppDataSource.getRepository("Skill").delete(
        skillId
      );
      if (deleteCount.affected === 0) {
        console.log(deleteCount);
        errorRes(res, 404, "failed", "ID不存在");
        return;
      }
      correctRes(res, skillId);
    } catch (error) {
      errorRes(res, 500, "error", "伺服器錯誤");
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
