// const { password } = require("../config/db");

const isUndefined = (value) => typeof value === "undefined";

const isNotValidString = (value) =>
  typeof value !== "string" || value.trim().length === 0;

const isNotValidInteger = (value) =>
  typeof value !== "number" || value < 0 || value % 1 !== 0;

// 輸入值為字串，值必須可被轉換為正整數
const isNotInputNumber = (value) =>
  !value || value.trim() === "" || isNaN(value) || Number(value) <= 0;

// 日期檢驗：moment.js 已deprecated
const dayjs = require("dayjs");
const customFormat = require("dayjs/plugin/customParseFormat");
const { password } = require("../config/db");
// 加載插件，開啟額外功能
dayjs.extend(customFormat);
const isValidDate = (startAt, endAt) => {
  const format = "YYYY-MM-DD HH:mm:ss";

  // 日期格式: date不固定，要當參數傳入、要return
  const validDate = (date) => {
    return dayjs(date, format, true).isValid();
  };
  // 驗證日期格式
  if (!validDate(startAt) || !validDate(endAt)) {
    return { isValid: false, message: "日期格式錯誤" };
  }
  // 驗證日期先後
  if (dayjs(startAt, format).isAfter(dayjs(endAt, format))) {
    return { isValid: false, message: "開始時間不得晚於結束時間" };
  }
  return { isValid: true };
};

// 封裝錯誤欄位的檢查邏輯，回傳錯誤欄位的訊息(後續要filter篩出錯誤)
const packageFieldsCheck = (data) => {
  const nameInvalid = isUndefined(data.name) || isNotValidString(data.name);
  const amountInvalid =
    isUndefined(data.credit_amount) || isNotValidInteger(data.credit_amount);
  const priceInvalid = isUndefined(data.price) || isNotValidInteger(data.price);

  return [
    { isInvalid: nameInvalid, message: "Name 須輸入字串" },
    { isInvalid: amountInvalid, message: "Credit_amount 須為非0的正整數" },
    { isInvalid: priceInvalid, message: "Price 須為非0的正整數" },
  ];
};

const skillFieldsCheck = (name) => {
  const nameInvalid = isUndefined(name) || isNotValidString(name);
  return { isInvalid: nameInvalid, message: "Name 須輸入字串" };
};

// 改進手動篩出錯誤，用陣列呈現該錯誤欄位訊息
const userFieldCheck = (data) => {
  const userFieldErrors = [];
  const userNameInvalid = isUndefined(data.name) || isNotValidString(data.name);
  const userEmailInvalid =
    isUndefined(data.email) || isNotValidString(data.email);
  const userPwdInvalid =
    isUndefined(data.password) || isNotValidString(data.password);

  if (userNameInvalid) {
    userFieldErrors.push("Name 不可為空或格式錯誤");
  }
  if (userEmailInvalid) {
    userFieldErrors.push("Email 不可為空或格式錯誤");
  }
  if (userPwdInvalid) {
    userFieldErrors.push("Password 不可為空或格式錯誤");
  }

  return userFieldErrors;
};

// 檢查必填欄位：陣列呈現錯誤欄位訊息
const coachFieldCheck = (data) => {
  const error = [];
  const yearsInvalid =
    isUndefined(data.experience_years) ||
    isNotValidInteger(data.experience_years);
  const descInvalid =
    isUndefined(data.description) || isNotValidString(data.description);

  if (yearsInvalid) {
    error.push("Years 須為非0的正整數");
  }
  if (descInvalid) {
    error.push("Description 須輸入字串");
  }
  return error;
};

// 封裝驗證「非必填」欄位：照片網址
const imgUrlCheck = (url) => {
  if (!url) return true;

  if (url && url.startsWith("https")) {
    const urlEnd = [".jpg", ".png"];
    const lowerUrl = url.toLowerCase();
    const urlResult = urlEnd.some((text) => lowerUrl.endsWith(text));
    return urlResult;
  }
  return false;
};

// 封裝驗證必填欄位：Course表
const courseFieldCheck = (data) => {
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
  if (
    isUndefined(userId) ||
    isNotValidString(userId) ||
    isUndefined(skillId) ||
    isNotValidString(skillId) ||
    isUndefined(name) ||
    isNotValidString(name) ||
    isUndefined(description) ||
    isNotValidString(description) ||
    isUndefined(startAt) ||
    isNotValidString(startAt) ||
    isUndefined(endAt) ||
    isNotValidString(endAt) ||
    isUndefined(maxParticipants) ||
    isNotValidInteger(maxParticipants)
  ) {
    return "欄位未填寫正確";
  }
  return null;
};

// 封裝驗證必填欄位：CourseId修改(無userId)
const courseEditFieldCheck = (data) => {
  const {
    skill_id: skillId,
    name,
    description,
    start_at: startAt,
    end_at: endAt,
    max_participants: maxParticipants,
    meeting_url: meetingUrl,
  } = data;
  if (
    isUndefined(skillId) ||
    isNotValidString(skillId) ||
    isUndefined(name) ||
    isNotValidString(name) ||
    isUndefined(description) ||
    isNotValidString(description) ||
    isUndefined(startAt) ||
    isNotValidString(startAt) ||
    isUndefined(endAt) ||
    isNotValidString(endAt) ||
    isUndefined(maxParticipants) ||
    isNotValidInteger(maxParticipants)
  ) {
    return "欄位未填寫正確";
  }
  return null;
};

// 封裝驗證「非必填」欄位：meeting_url from Course
const meetingUrlCheck = (url) => {
  if (isNotValidString(url) || !url.startsWith("https")) {
    return false;
  }
  return true;
};

// 封裝驗證回傳的參數格式是否正確
const coachesQueryCheck = (per, page) => {
  if (isNotInputNumber(per) || isNotInputNumber(page)) {
    return "欄位填寫錯誤，請輸入正整數";
  }
  return null;
};

// login必填欄位驗證
const loginFieldCheck = (email, password) => {
  const loginFieldErr = [];
  const userEmailInvalid = isUndefined(email) || isNotValidString(email);
  const userPwdInvalid = isUndefined(password) || isNotValidString(password);
  if (userEmailInvalid) {
    loginFieldErr.push("Email 不可為空或格式錯誤");
  };
  if (userPwdInvalid) {
    loginFieldErr.push("Password 不可為空或格式錯誤");
  };
  return loginFieldErr;
};

// Password 規則驗證
const pwdRuleCheck = (password) => {
  const pwdPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;
    if (!pwdPattern.test(password)) {
      return "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
    }
    return null;
};

// Name 規則驗證
const nameRuleCheck = (name) => {
  const userPattern = /^[a-zA-Z0-9\u4e00-\u9fff]{2,10}$/;
  if (!userPattern.test(name)) {
    return "姓名不符合規則，不可包含任何特殊符號與空白，最少2個字，最多10個字"
  }
  return null;
};


module.exports = {
  packageFieldsCheck,
  skillFieldsCheck,
  userFieldCheck,
  coachFieldCheck,
  imgUrlCheck,
  isValidDate,
  courseFieldCheck,
  courseEditFieldCheck,
  meetingUrlCheck,
  coachesQueryCheck,
  loginFieldCheck,
  pwdRuleCheck,
  nameRuleCheck
};
