const Flow = require('../models/Flow');
const FlowStep = require('../models/FlowStep');
const FollowUp = require('../models/FollowUp');

// @desc    Get all flows
// @route   GET /api/flow-mgmt
const getFlows = async (req, res) => {
    try {
        const flows = await Flow.find({}).sort({ createdAt: -1 });
        res.json(flows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get flow by ID
// @route   GET /api/flow-mgmt/:id
const getFlowById = async (req, res) => {
    try {
        const flow = await Flow.findById(req.params.id);
        if (!flow) return res.status(404).json({ message: 'Flow not found' });
        res.json(flow);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new flow
// @route   POST /api/flow-mgmt
const createFlow = async (req, res) => {
    try {
        const { name, description } = req.body;
        const flow = await Flow.create({ name, description });
        res.status(201).json(flow);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update flow metadata
// @route   PUT /api/flow-mgmt/:id
const updateFlow = async (req, res) => {
    try {
        const flow = await Flow.findById(req.params.id);
        if (!flow) return res.status(404).json({ message: 'Flow not found' });

        flow.name = req.body.name || flow.name;
        flow.description = req.body.description || flow.description;
        flow.isPublished = req.body.isPublished !== undefined ? req.body.isPublished : flow.isPublished;
        flow.isActive = req.body.isActive !== undefined ? req.body.isActive : flow.isActive;

        const updatedFlow = await flow.save();
        res.json(updatedFlow);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete flow and its steps
// @route   DELETE /api/flow-mgmt/:id
const deleteFlow = async (req, res) => {
    try {
        const flow = await Flow.findById(req.params.id);
        if (!flow) return res.status(404).json({ message: 'Flow not found' });

        await FlowStep.deleteMany({ flowId: flow._id });
        await flow.deleteOne();
        res.json({ message: 'Flow and associated steps removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get follow-ups for a flow
// @route   GET /api/flow-mgmt/followups/:id
const getFollowUps = async (req, res) => {
    try {
        const followups = await FollowUp.find({ flowId: req.params.id }).sort({ delayHours: 1 });
        res.json(followups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create or update a follow-up rule
// @route   POST /api/flow-mgmt/followups/:id
const upsertFollowUp = async (req, res) => {
    try {
        const { delayHours, text, options } = req.body;
        const flowId = req.params.id;

        // Find existing or create new
        let followup = await FollowUp.findOne({ flowId, delayHours });
        if (followup) {
            followup.text = text;
            followup.options = options;
            await followup.save();
        } else {
            followup = await FollowUp.create({ flowId, delayHours, text, options });
        }

        res.json(followup);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getFlows, getFlowById, createFlow, updateFlow, deleteFlow, getFollowUps, upsertFollowUp };
