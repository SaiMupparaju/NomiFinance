const Suggestion = require('../models/suggestion.model');

exports.createSuggestion = async (req, res) => {
  try {
    const { suggestion } = req.body;
    console.log("processsing suggestion", suggestion);

    const newSuggestion = new Suggestion({
        suggestion,
        //userId: req.user._id,
      });

    await newSuggestion.save();

    res.status(201).json({ message: 'Suggestion submitted successfully' });
  } catch (error) {
    console.error('Error submitting suggestion:', error);
    res.status(500).json({ error: 'Failed to submit suggestion' });
  }
};
