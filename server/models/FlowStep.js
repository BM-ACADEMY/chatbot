const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    label: { type: String, required: true },
    nextStep: { type: String } // matches stepId to progress the flow
}, { _id: false });

const flowStepSchema = new mongoose.Schema({
    stepId: { type: String, required: true },
    flowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow', required: true },
    question: { type: String, required: true },
    isEntryPoint: { type: Boolean, default: false },
    nextStep: { type: String }, // Root nextStep for non-option/open-response nodes
    type: { type: String, enum: ['message', 'input', 'action'], default: 'message' },
    tagsOnReach: [{ type: String }], // Tags to add to user when they hit this step
    assignmentAction: { type: String }, // e.g. 'sales', 'counselor', 'hr'
    captureMapping: { type: String }, // Field to save user response to (e.g. 'name', 'phone', 'address', 'resume')
    captureType: { type: String, enum: ['text', 'file'], default: 'text' }, // What format to expect
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
    },
    uiData: { type: Object, default: {} }, // Metadata for frontend UI state
    options: [optionSchema]
}, { timestamps: true });

// Ensure stepId is unique WITHIN a flow
flowStepSchema.index({ stepId: 1, flowId: 1 }, { unique: true });

const FlowStep = mongoose.model('FlowStep', flowStepSchema);
module.exports = FlowStep;
