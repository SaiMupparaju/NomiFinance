const express = require('express');
const router = express.Router();
const ruleController = require('../../controllers/rule.controller');

// Define routes for CRUD operations
router.post('/create', ruleController.createRule);
router.get('/rules', ruleController.getRules);
router.get('/:id', ruleController.getRuleById);
router.get('/rules/user/:userId', ruleController.getUserRules); // New route to fetch rules by user ID
router.put('/:id', ruleController.updateRule);
router.delete('/rules/:id', ruleController.deleteRule);
router.put('/:id/jobId', ruleController.updateRuleJobId);
router.put('/:id/activate', ruleController.activateRule);
router.put('/:id/deactivate', ruleController.deactivateRule);


module.exports = router;
