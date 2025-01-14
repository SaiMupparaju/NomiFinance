const Rule = require('../models/Rule');
const schedulerApi = require('../utils/schedulerApi');
const User = require('../models/user.model');

function convertCustomValueToNumber(rulePart) {
  // If it’s an array, recurse on each element
  if (Array.isArray(rulePart)) {
    rulePart.forEach(convertCustomValueToNumber);
    return;
  }

  // If it’s an object, check each key
  if (rulePart && typeof rulePart === 'object') {
    for (const key in rulePart) {
      // Check if we have a "params.customValue" scenario
      if (key === 'params' && rulePart.params && rulePart.params.customValue) {
        const { customValue } = rulePart.params;
        if (typeof customValue === 'string' && !isNaN(customValue)) {
          // Convert numeric string to actual number
          rulePart.params.customValue = parseFloat(customValue);
        }
      }

      // Recurse deeper for nested objects or arrays
      convertCustomValueToNumber(rulePart[key]);
    }
  }
}


// Create a new rule
exports.createRule = async (req, res) => {
  try {
    const { creatorId, subscriberId, rule, isActive, isApplet, appletId, appletInputs } = req.body;

    // Validate input
    if (!creatorId || !subscriberId || !rule) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    convertCustomValueToNumber(rule);

    // Create a new Rule instance
    const newRule = new Rule({
      creatorId,
      subscriberId,
      rule,
      isActive: isActive !== undefined ? isActive : true,
      // Add applet fields if present
      ...(isApplet && { 
        isApplet: true,
        appletId,
        appletInputs 
      })
    });

    // Schedule the job if the rule is active
    if (newRule.isActive) {
      const jobData = await schedulerApi.scheduleJob(newRule);
      newRule.jobId = jobData.job._id;
    }

    await newRule.save();
    res.status(201).json(newRule);
  } catch (error) {
    console.error('Error creating rule:', error);
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

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const rule = await Rule.findById(id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    if (String(rule.subscriberId) !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Fetch user's current active rules
    const userActiveRules = await Rule.find({ subscriberId: userId, isActive: true });

    // Get user's subscription info
    const user = await User.findById(userId);
    const subscriptionProductId = user.subscriptionProductId;

    let limit = 0;
    if (subscriptionProductId === process.env.NOMI_PREMIUM_ID) { // Price id fix
      limit = Infinity;
    } else if (subscriptionProductId === process.env.NOMI_STANDARD_ID) {
      limit = 4;
    } else if (subscriptionProductId === process.env.NOMI_SINGLE_ID) {
      limit = 1;
    } else {
      limit = 1;
    }

    if (userActiveRules.length >= limit) {
      return res.status(400).json({
        error: `You have reached the limit of ${limit} active rules for your subscription.`,
      });
    }

    rule.isActive = true;
    await rule.save();

    // Schedule the job
    const jobData = await schedulerApi.scheduleJob(rule);

    if (jobData && jobData.job && jobData.job._id) {
      rule.jobId = jobData.job._id;
      //      console.log("newly activated rule's job id", jobData._id, jobData.data._id);
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
    const { creatorId, subscriberId, rule, appletInputs } = req.body;

    convertCustomValueToNumber(rule);
    
    const updateData = {
      creatorId,
      subscriberId,
      rule
    };

    // If updating an applet rule, update the inputs
    if (appletInputs) {
      updateData.appletInputs = appletInputs;
    }

    const updatedRule = await Rule.findByIdAndUpdate(
      req.params.id,
      updateData,
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
// Import your scheduler API cancelJob method
//const { cancelJob } = require('../schedulerApi'); // adjust the path accordingly

exports.deleteRule = async (req, res) => {
  try {
    
    const rule = await Rule.findById(req.params.id);
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }


    if (rule.jobId) {
      console.log(`Job ID found. Cancelling job with ID: ${rule.jobId}`);
      await schedulerApi.cancelJob(rule.jobId); 
    }
    await Rule.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting rule:', error);
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
      // Instead of returning a 404 error, return a specific status code or message
      return res.status(202).json({ message: 'Rule not found, jobId not updated' });
    }

    res.status(200).json(updatedRule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};