const Rule = require('../models/Rule');
const schedulerApi = require('../utils/schedulerApi');

// Create a new rule
exports.createRule = async (req, res) => {
  try {
    const { creatorId, subscriberId, rule, color } = req.body;

    // Validate input
    if (!creatorId || !subscriberId || !rule) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newRule = new Rule({
      creatorId,
      subscriberId,
      rule,
      color: color || '#ffffff' 
    });

    await newRule.save();

    // Send the rule to the scheduler API
    await schedulerApi.scheduleJob(newRule);

    res.status(201).json(newRule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRuleColor = async (req, res) => {
  try {
    const { color } = req.body;
    const { id } = req.params;

    if (!color) {
      return res.status(400).json({ error: 'Color is required' });
    }

    const updatedRule = await Rule.findByIdAndUpdate(
      id,
      { color },
      { new: true, runValidators: true }
    );

    if (!updatedRule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.status(200).json({ message: 'Rule color updated successfully', rule: updatedRule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all rules
exports.getRules = async (req, res) => {
  try {
    const rules = await Rule.find();
    res.status(200).json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Activate a rule by ID
exports.activateRule = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let rule = await Rule.findById(id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Check if the user is authorized to activate this rule
    if (String(rule.subscriberId) !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    rule.isActive = true;
    await rule.save();

    // Reschedule the job with the updated rule
    const jobData = await schedulerApi.scheduleJob(rule);

    // Update the rule's jobId with the new job ID
    if (jobData && jobData.job && jobData.job.attrs && jobData.job.attrs._id) {
      rule.jobId = jobData.job.attrs._id;
      await rule.save();
    } else {
      console.error('Failed to get jobId from scheduler response');
    }

    res.status(200).json({ message: 'Rule activated successfully', rule });
  } catch (error) {
    console.error('Error activating rule:', error);
    res.status(500).json({ error: error.message });
  }
};


// Deactivate a rule by ID
exports.deactivateRule = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const rule = await Rule.findById(id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Check if the user is authorized to deactivate this rule
    if (String(rule.subscriberId) !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    rule.isActive = false;
    await rule.save();

    // Cancel the scheduled job
    await schedulerApi.cancelJob(rule.jobId);

    res.status(200).json({ message: 'Rule deactivated successfully', rule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single rule by ID
exports.getRuleById = async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.status(200).json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a rule by ID
exports.updateRule = async (req, res) => {
  try {
    
    const { creatorId, subscriberId, rule, color } = req.body;

    const updatedRule = await Rule.findByIdAndUpdate(
      req.params.id,
      { creatorId, subscriberId, rule, color },
      { new: true, runValidators: true }
    );

    if (!updatedRule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Reschedule the job with the updated rule
    await schedulerApi.scheduleJob(updatedRule);

    res.status(200).json(updatedRule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a rule by ID
exports.deleteRule = async (req, res) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.status(200).json({ message: 'Rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserRules = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Fetch rules where the user is the creator or subscriber
    const rules = await Rule.find({ $or: [{ subscriberId: userId }, { subscriberId: userId }] });

    res.status(200).json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRuleJobId = async (req, res) => {
  try {
    const { jobId } = req.body;
    const { id } = req.params;

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    const updatedRule = await Rule.findByIdAndUpdate(
      id,
      { jobId },
      { new: true, runValidators: true }
    );

    if (!updatedRule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.status(200).json(updatedRule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};