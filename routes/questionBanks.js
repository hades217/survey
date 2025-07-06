const express = require('express');
const router = express.Router();
const questionBankController = require('../controllers/questionBankController');
const { requireAuth } = require('../middlewares/auth');

// Apply authentication middleware to all routes
router.use(requireAuth);

// Question Bank routes
router.get('/', questionBankController.getAllQuestionBanks);
router.post('/', questionBankController.createQuestionBank);
router.get('/:id', questionBankController.getQuestionBank);
router.put('/:id', questionBankController.updateQuestionBank);
router.delete('/:id', questionBankController.deleteQuestionBank);

// Question management routes
router.post('/:id/questions', questionBankController.addQuestion);
router.put('/:id/questions/:questionIndex', questionBankController.updateQuestion);
router.delete('/:id/questions/:questionIndex', questionBankController.deleteQuestion);

// Utility routes
router.get('/:id/random-questions', questionBankController.getRandomQuestions);
router.post('/:id/import', questionBankController.importQuestions);

module.exports = router;