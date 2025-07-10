const express = require('express');
const router = express.Router();
const questionBankController = require('../controllers/questionBankController');
const { jwtAuth } = require('../middlewares/jwtAuth');

// Apply JWT authentication middleware to all routes
router.use(jwtAuth);

// Question Bank routes
router.get('/', questionBankController.getAllQuestionBanks);
router.post('/', questionBankController.createQuestionBank);
router.get('/:id', questionBankController.getQuestionBank);
router.put('/:id', questionBankController.updateQuestionBank);
router.delete('/:id', questionBankController.deleteQuestionBank);

// Question management routes
router.post('/:id/questions', questionBankController.addQuestion);
router.put('/:id/questions/:questionId', questionBankController.updateQuestion);
router.delete('/:id/questions/:questionId', questionBankController.deleteQuestion);

// Utility routes
router.get('/:id/random-questions', questionBankController.getRandomQuestions);
router.post('/:id/import', questionBankController.importQuestions);

module.exports = router;
