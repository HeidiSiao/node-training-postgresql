const { IsNull } = require("typeorm");
const { isUUID } = require("validator");
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Coach");
const { customErr, correctRes } = require("../utils/resHandle");

const coursesController = {

  // GET 取得課程列表
  // 要先去POST Course 改 skill_id
  async getCourses (req,res,next){
    const coursesRepo = dataSource.getRepository("Course");
    // find()方法會返回查詢結果的陣列
    // 資料庫取得包含多筆課程資料的陣列
    // const coursesRecord = await coursesRepo.find({
    //   select: {
    //     id: true,
    //     // 選擇關聯表中的 name 欄位
    //     User: { name: true },
    //     Skill: { name: true },
    //     name: true,
    //     description: true,
    //     start_at: true,
    //     end_at: true,
    //     max_participants: true
    //   },
    //   // 直接載入整個 User 和 Skill 物件
    //   relations: ["User", "Skill"]
    // });
  
  
    const coursesRecord = await coursesRepo.find({
      select: {
        id: true,
        name: true,
        description: true,
        start_at: true,
        end_at: true,
        max_participants: true
      },
      relations: ["User", "Skill"]  // 確保載入 User 和 Skill 物件
    });
  
    // 直接回傳一個物件 ({ ... }) 陣列(map)
    // 資料結構調整原始嵌套在 User 和 Skill 物件的紀錄
    const courseTable = coursesRecord.map(record => ({
      id: record.id,
      coach_name: record.User.name,
      skill_name: record.Skill.name,
      name: record.name,
      description: record.description,
      start_at: record.start_at,
      end_at: record.end_at,
      max_participants: record.max_participants
    }));
    correctRes(res, courseTable);
  
  },

  // 報名課程
  async postCourse (req,res,next) {
  
    // 來自 JWT的 userId，若取多個值，會優先使用解構賦值
    // const userId = req.user.id;  
    const { id } = req.user; 
    const { courseId } = req.params;
    console.log("req.params:", req.params);
    console.log("req.user:", req.user);
  
    // 先確認 courseId 格式正確，才進入資料庫查詢驗證
    if (!isUUID(courseId)) {
      logger.warn("欄位未填寫正確");
      throw customErr(400,"課程ID無效");
    };
  
    // 確認資料庫是否有此課程ID
    const courseRepo = dataSource.getRepository("Course");
    const courseRecord = await courseRepo.findOne({
      where: {
        id: courseId
      }
    });
    if (!courseRecord) {
      logger.warn("找不到課程ID");
      throw customErr(404,"課程ID不存在");
    };
   
    // 檢查是否已報名過課程
    const bookingRepo = dataSource.getRepository("CourseBooking");
    const bookingRecord = await bookingRepo.findOne({
      where: {
        user_id: id, // 使用者的 ID，來自 JWT 登入後的資料
        course_id: courseId, // 課程的 ID，來自 URL 參數
      }
    });
  
    // 
    if (bookingRecord) {
      logger.warn("課程紀錄已存在，使用者重複報名");
      throw customErr(409, "已經報名過此課程","conflict");
    }
  
    // 檢查使用者的課程堂數是否足夠使用
    // 計算 使用者在 purchased_credits欄位的 堂數總和
    const purchaseRepo = dataSource.getRepository("CreditPurchase");
    const userCourseCredit = await purchaseRepo.sum('purchased_credits', {
      user_id: id
    });
  
    // 計算 使用者有效(已結束或是未使用)課程，排除已取消的課程
    let userUsedCredit = await bookingRepo.count({
      where: {
        user_id: id,
        cancelledAt: IsNull()
      }
    });
  
  
    // 檢查課程堂數是否超出人數無法報名
    // 計算 有效的報名總數，排除已取消的紀錄
  let bookingRecordCount = await bookingRepo.count({
      where: {
        course_id: courseId,
        cancelledAt: IsNull()
      }
    });
  
    // 檢查用戶是否有足夠的可用堂數：有效課程數 超出 總購買的課程數 
    // 課程的報名人數是否已滿：有效報名人數 超出 課程報名人數門檻  
    // 確保course是物件且前面已查詢過，後續才可存取course的任何欄位  
    if (userCourseCredit - userUsedCredit <= 0 ) {
      logger.warn("當前課程不足與請求衝突，無法完成操作");
      throw customErr(409, "已無可使用堂數","conflict");
  
    } else if (bookingRecordCount >= courseRecord.max_participants) {
      logger.warn("當前課程人數已滿與請求衝突，無法完成操作");
      throw customErr(409, "已達最大參加人數，無法參加","conflict");
    }
    
    // 建立新的報名紀錄
    // 建立新的報名紀錄時，將 req.user.id (即目前登入的用戶的 ID) 作為 user_id 的值傳入
    const newBooking = await bookingRepo.create({
      user_id: req.user.id,
      course_id: courseId
    });
    const savedBooking = await bookingRepo.save(newBooking);
    
    // null 請求成功不回傳data
    correctRes(res, null, 201);
  },

  // 取消報名
  async deleteCourse (req, res, next) { 
    // id: '92e924ca-a85b-4366-ba79-5b6cf448e7d3',
      const  { id }  = req.user; 
      const { courseId } = req.params;
    
      // 先確認 courseId 格式正確，才進入資料庫查詢驗證
      if (!isUUID(courseId)) {
        logger.warn("欄位未填寫正確");
        throw customErr(400,"課程ID無效");
      };
    
      // 檢查此課程是否已存在資料庫＝已報名
        const bookingRepo = dataSource.getRepository("CourseBooking");
        const bookingRecord = await bookingRepo.findOne({
          where: {
            user_id: id,
            course_id: courseId,
            cancelledAt: IsNull()
          }
        });
    
        if (!bookingRecord) {
          logger.warn("找不到課程ID");
          throw customErr(404,"該用戶未報名此課程");
        };
    
       if (bookingRecord.cancelledAt !== null) {
        logger.warn("使用者無法操作已取消的紀錄");
        throw customErr(409,"取消紀錄已存在","conflict");
      };
    
      // ID存在、尚未被取消的紀錄才可被更新
      // 語法：先放要更新的條件，再放要更新的欄位
        bookingRecord.cancelledAt = new Date().toISOString()
        const savedRecord = await bookingRepo.save(bookingRecord);
           
        if (!savedRecord) {
          logger.warn("使用者無法刪除課程");
          throw customErr(400,"取消失敗");
          };
            
        correctRes(res, null);  
    }
};


module.exports = coursesController;
