const FlowStep = require('../models/FlowStep');
const UserProgress = require('../models/UserProgress');

// @desc    Get all flow steps (Admin)
// @route   GET /api/flow
const getFlowSteps = async (req, res) => {
    try {
        const { flowId } = req.query;
        const filter = flowId ? { flowId } : {};
        const steps = await FlowStep.find(filter).sort({ stepId: 1 });
        res.json(steps);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get flow step by stepId
// @route   GET /api/flow/:stepId
const getFlowStepById = async (req, res) => {
    try {
        const { flowId } = req.query;
        const step = await FlowStep.findOne({ stepId: req.params.stepId, flowId });
        if (step) {
            res.json(step);
        } else {
            res.status(404).json({ message: 'Flow step not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new flow step (Admin)
// @route   POST /api/flow
const createFlowStep = async (req, res) => {
    try {
        const { 
            stepId, flowId, question, options, nextStep,
            position, uiData, assignmentAction, 
            captureMapping, captureType, tagsOnReach 
        } = req.body;
        
        if (!flowId) return res.status(400).json({ message: 'Flow ID is required' });

        const stepExists = await FlowStep.findOne({ stepId, flowId });
        if (stepExists) {
            return res.status(400).json({ message: 'Step ID already exists in this flow' });
        }

        const step = await FlowStep.create({ 
            stepId, flowId, question, options, nextStep,
            position, uiData, assignmentAction,
            captureMapping, captureType, tagsOnReach
        });
        res.status(201).json(step);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update flow step (Admin)
// @route   PUT /api/flow/:id
const updateFlowStep = async (req, res) => {
    try {
        const step = await FlowStep.findById(req.params.id);
        if (!step) {
            return res.status(404).json({ message: 'Flow step not found' });
        }

        const fields = [
            'stepId', 'question', 'options', 'nextStep', 'position', 
            'uiData', 'assignmentAction', 'captureMapping', 
            'captureType', 'tagsOnReach', 'isEntryPoint'
        ];

        if (req.body.isEntryPoint === true) {
            await FlowStep.updateMany(
                { flowId: step.flowId, _id: { $ne: step._id } }, 
                { $set: { isEntryPoint: false } }
            );
        }

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                step[field] = req.body[field];
            }
        });

        const updatedStep = await step.save();
        res.json(updatedStep);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete flow step (Admin)
// @route   DELETE /api/flow/:id
const deleteFlowStep = async (req, res) => {
    try {
        const step = await FlowStep.findById(req.params.id);
        if (!step) return res.status(404).json({ message: 'Flow step not found' });
        await step.deleteOne();
        res.json({ message: 'Flow step removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- USER PROGRESS ---

// @desc    Get user progress
// @route   GET /api/progress/:userId
const getUserProgress = async (req, res) => {
    try {
        // Only allow admin or the user themselves
        if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const progress = await UserProgress.findOne({ userId: req.params.userId });
        if (progress) {
            res.json(progress);
        } else {
            res.status(404).json({ message: 'Progress not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user progress
// @route   POST /api/progress
const updateUserProgress = async (req, res) => {
    try {
        const { currentStep, selectedOptions, completed } = req.body;
        let progress = await UserProgress.findOne({ userId: req.user._id });

        if (progress) {
            progress.currentStep = currentStep !== undefined ? currentStep : progress.currentStep;
            if (selectedOptions) {
                progress.selectedOptions = selectedOptions;
            }
            progress.completed = completed !== undefined ? completed : progress.completed;

            const updatedProgress = await progress.save();
            return res.json(updatedProgress);
        } else {
            progress = await UserProgress.create({
                userId: req.user._id,
                currentStep: currentStep || '1',
                selectedOptions: selectedOptions || [],
                completed: completed || false
            });
            return res.status(201).json(progress);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFlowSteps, getFlowStepById, createFlowStep, updateFlowStep, deleteFlowStep,
    getUserProgress, updateUserProgress
};
