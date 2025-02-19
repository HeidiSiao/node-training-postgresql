const { isUndefined, isNotValidString, isNotValidInteger } = require("./utils");

// 封裝錯誤欄位的檢查邏輯，回傳錯誤欄位的訊息
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

const skillFieldsCheck = (data) => {
  const nameInvalid = isUndefined(data.name) || isNotValidString(data.name);
  return { isInvalid: nameInvalid, message: "Name 須輸入字串" };
};

module.exports = { packageFieldsCheck, skillFieldsCheck };
