const express = require('express');
const router = express.Router();
const { getFlows, getFlowById, createFlow, updateFlow, deleteFlow, getFollowUps, upsertFollowUp } = require('../controllers/flowManagementController');
const { getFlowSteps, getFlowStepById, createFlowStep, updateFlowStep, deleteFlowStep } = require('../controllers/flowController');
const { protect, admin } = require('../middleware/authMiddleware');

// Flow Management (High-level)
router.route('/mgmt').get(protect, admin, getFlows).post(protect, admin, createFlow);
router.route('/mgmt/:id').get(protect, admin, getFlowById).put(protect, admin, updateFlow).delete(protect, admin, deleteFlow);
router.route('/mgmt/followups/:id').get(protect, admin, getFollowUps).post(protect, admin, upsertFollowUp);

// Flow Steps (Detailed)
router.route('/').get(protect, getFlowSteps).post(protect, admin, createFlowStep);
router.route('/:stepId').get(protect, getFlowStepById);
router.route('/:id').put(protect, admin, updateFlowStep).delete(protect, admin, deleteFlowStep);

module.exports = router;
