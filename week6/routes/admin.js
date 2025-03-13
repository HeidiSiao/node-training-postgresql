const express = require("express");
const router = express.Router();

const { dataSource } = require("../db/data-source");
// 區分不同模組的日誌，傳入模組標籤("XXX")
const logger = require("../utils/logger")("Admin");
const { isUUID } = require("validator");
const {
  coachFieldCheck,
  imgUrlCheck,
  isValidDate,
  courseFieldCheck,
  courseEditFieldCheck,
  meetingUrlCheck,
} = require("../utils/validUtils");
const { customErr, correctRes } = require("../utils/resHandle");
const isAuth = require("../middlewares/isAuth")

// 注意此路由要放上面，否則無法進入該路徑
router.post("/coaches/courses", isAuth, async (req, res, next) => {
  try {
    const data = req.body;
    const {
      user_id: userId,
      skill_id: skillId,
      name,
      description,
      start_at: startAt,
      end_at: endAt,
      max_participants: maxParticipants,
      meeting_url: meetingUrl,
    } = data;

    // 驗證所有必填欄位(全)
    const isValidCheck = courseFieldCheck(data);
    if (isValidCheck) {
      logger.warn(isValidCheck);
      throw customErr(400,`${isValidCheck}`);
    }

    // (日期)未來如果會擴增檢核的日期欄位種類，才用物件包和解構
    const result = isValidDate(startAt, endAt);
    if (!result.isValid) {
      logger.warn("日期格式錯誤");
      throw customErr(400,`${result.message}`);
    }
    // (網址填寫正確) 非必填欄位檢查：meeting_url
    const isUrlCorrect = meetingUrlCheck(meetingUrl);
    if (!isUrlCorrect) {
      logger.warn("欄位未填寫正確");
      throw customErr(400,"meeting_url網址無效");
    }
    // (檢查使用者ID)是否存在，查找user表、並指定返回欄位
    const userRepo = dataSource.getRepository("User");
    const userRecord = await userRepo.findOne({
      select: ["id", "name", "role"],
      where: { id: userId },
    });
    if (!userRecord) {
      logger.warn("使用者不存在");
      throw customErr(400, "使用者不存在");
    } else if (userRecord.role !== "COACH") {
      logger.warn("使用者沒有權限操作");
      throw customErr(403,"使用者尚未成為教練，沒有權限訪問","forbidden");
    }
    // 檢查回傳的資料欄位是否重複，在同時間已存在課程
    const courseRepo = dataSource.getRepository("Course");
    const courseRecord = await courseRepo.findOne({
      where: {
        user_id: userId,
        start_at: startAt,
      },
    });
    if (courseRecord) {
      logger.warn("課程資料重疊");
      throw customErr(409,"開課時間已重疊","conflict");
    }

    // 建立新課程
    const newCourse = courseRepo.create({
      user_id: userId,
      skill_id: skillId,
      name,
      description,
      start_at: startAt,
      end_at: endAt,
      max_participants: maxParticipants,
      meeting_url: meetingUrl,
    });
    const savedCourse = await courseRepo.save(newCourse);
    // 取得資料庫中最新完整資料，不止儲存過程中資料，需要額外查詢取得包含自動生成的欄位
    const fetchedCourse = await courseRepo.findOne({
      where: { id: savedCourse.id },
    });

    const dataRes = {
      course: fetchedCourse,
    };

    correctRes(res, dataRes, 201);
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.put("/coaches/courses/:courseId", isAuth, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const data = req.body;
    const {
      skill_id: skillId,
      name,
      description,
      start_at: startAt,
      end_at: endAt,
      max_participants: maxParticipants,
      meeting_url: meetingUrl,
    } = data;

    // 必填欄位驗證
    const isValidCheck = courseEditFieldCheck(data);
    if (isValidCheck) {
      logger.warn(isValidCheck);
      throw customErr(400,`${isValidCheck}`);
    }

    // 日期驗證
    const result = isValidDate(startAt, endAt);
    if (!result.isValid) {
      logger.warn("日期格式錯誤");
      throw customErr(400,`${result.message}`);
    }

    //非必填驗證：會議網址
    const isUrlCorrect = meetingUrlCheck(meetingUrl);
    if (!isUrlCorrect) {
      logger.warn("欄位未填寫正確");
      throw customErr(400, "meeting_url網址無效");
    }

    // 查詢課程Id是否存在
    const courseRepo = dataSource.getRepository("Course");
    const courseRecord = await courseRepo.findOne({
      where: {
        id: courseId,
      },
    });
    if (!courseRecord) {
      logger.warn("課程不存在");
      throw customErr(404,"查無此課程");
    }

    // 課程是否更新成功
    const updateCourse = await courseRepo.update(
      {
        id: courseId,
      },
      {
        skill_id: skillId,
        name,
        description,
        start_at: startAt,
        end_at: endAt,
        max_participants: maxParticipants,
        meeting_url: meetingUrl,
      }
    );
    if (updateCourse.affected === 0) {
      logger.warn("更新課程失敗");
      throw customErr(404, "更新課程失敗");
    }
    //  更新完後只會回傳更新的訊息，需要再把更新的結果撈出來
    const courseResult = await courseRepo.findOne({
      where: {
        id: courseId,
      },
    });
    console.log(courseId);
    const dataRes = {
      course: courseResult,
    };

    correctRes(res, dataRes);
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.post("/coaches/:userId", async (req, res, next) => {
  try {
    // 從 url 取得的
    const { userId } = req.params;
    const data = req.body;
    const { experience_years, description, profile_image_url } = data;

    // 先確認 userId 是否為有效的 UUID 格式
    if (!isUUID(userId)) {
      logger.warn("欄位未填寫正確");
      throw customErr(400,"使用者ID為無效格式");
    }

    // 檢查必填欄位格式是否正確
    const invalidMsg = coachFieldCheck(data);
    if (invalidMsg.length > 0) {
      logger.warn("欄位未填寫正確");
      throw customErr(400,`欄位未填寫正確：${invalidMsg}`);
    }

    // 檢查「非必填」欄位：照片網址檔案格式
    const isUrlCorrect = imgUrlCheck(profile_image_url);
    if (!isUrlCorrect) {
      logger.warn("欄位未填寫正確");
      throw customErr(400,"照片網址無效");
    }

    // 檢查的是該 userId 是否在 User 表中存在
    // 若查詢到該使用者資料，進一步查看 COACH 表確認使用者是否已經是教練
    const userRepo = dataSource.getRepository("User");
    const userRecord = await userRepo.findOne({
      // select 限制返回的欄位
      select: ["id", "name", "role"],
      where: {
        id: userId,
      },
    });
    if (!userRecord) {
      logger.warn("使用者不存在");
      throw customErr(400,"使用者不存在");
    } else if (userRecord.role === "COACH") {
      logger.warn("使用者已經是教練");
      throw customErr(409,"使用者已經是教練","conflict");
    }

    const updatedUser = await userRepo.update(
      // 放條件
      {
        id: userId,
      },
      // 欲更新的欄位
      {
        role: "COACH",
      }
    );
    if (updatedUser.affected === 0) {
      logger.warn("更新使用者失敗");
      throw customErr(400, "更新使用者失敗");
    }

    const coachRepo = dataSource.getRepository("Coach");
    console.log("userId: ", userId);
    const newCoach = coachRepo.create({
      user_id: userId,
      experience_years,
      description,
      profile_image_url,
    });
    const savedCoach = await coachRepo.save(newCoach);

    // update完想要獲得已被更新的資料要再查詢一次
    const userResult = await userRepo.findOne({
      select: ["name", "role"],
      where: {
        id: userId,
      },
    });

    const dataRes = {
      user: userResult,
      coach: savedCoach,
    };

    correctRes(res, dataRes, 201);
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

module.exports = router;
