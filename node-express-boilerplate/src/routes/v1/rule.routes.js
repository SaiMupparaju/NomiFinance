const express = require('express');
const router = express.Router();
const ruleController = require('../../controllers/rule.controller');
const authMiddleware = require('../../middlewares/auth');

// Define routes for CRUD operations
router.post('/create', ruleController.createRule);
router.get('/rules', ruleController.getRules);
router.get('/:id', ruleController.getRuleById);
router.get('/rules/user/:userId', ruleController.getUserRules); // New route to fetch rules by user ID
router.put('/:id', ruleController.updateRule);
router.delete('/:id', ruleController.deleteRule);
router.put('/:id/jobId', ruleController.updateRuleJobId);
router.put('/:id/activate', ruleController.activateRule);
router.put('/:id/deactivate', ruleController.deactivateRule);
router.put('/:id/color', ruleController.updateRuleColor);


module.exports = router;
