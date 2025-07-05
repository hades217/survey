// 错误消息常量
const ERROR_MESSAGES = {
  SURVEY_NOT_FOUND: 'Survey not found',
  INVALID_STATUS: 'Invalid status. Must be one of: draft, active, closed',
  UNAUTHORIZED: 'unauthorized',
  INVALID_DATA: 'invalid data',
  INVALID_CORRECT_ANSWER: 'invalid correctAnswer'
};

// 状态常量
const SURVEY_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed'
};

// 类型常量
const SURVEY_TYPE = {
  SURVEY: 'survey',
  ASSESSMENT: 'assessment'
};

// 数据类型常量
const DATA_TYPES = {
  STRING: 'string',
  NUMBER: 'number'
};

// HTTP状态码常量
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// 有效状态数组
const VALID_STATUSES = [SURVEY_STATUS.DRAFT, SURVEY_STATUS.ACTIVE, SURVEY_STATUS.CLOSED];

module.exports = {
  ERROR_MESSAGES,
  SURVEY_STATUS,
  SURVEY_TYPE,
  DATA_TYPES,
  HTTP_STATUS,
  VALID_STATUSES
};