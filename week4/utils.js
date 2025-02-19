const isUndefined = (value) => typeof value === "undefined";

const isNotValidString = (value) =>
  typeof value !== "string" || value.trim().length === 0;

const isNotValidInteger = (value) =>
  typeof value !== "number" || value < 0 || value % 1 !== 0;

module.exports = { isUndefined, isNotValidString, isNotValidInteger };
