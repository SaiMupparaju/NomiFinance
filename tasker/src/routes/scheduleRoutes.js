// src/routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const ScheduleService = require('../services/scheduleService');
const agenda = require('../agenda');

const scheduleService = new ScheduleService(agenda);

// Schedule a new job
router.post('/schedule', async (req, res) => {
    console.log("recieved request:", req.body);
    try {
    const { rule } = req.body;


    if (!rule) {
        return res.status(400).json({ error: 'Missing rule or schedule data' });
    }

    const {schedule} = rule;
    //console.log("rule:", rule, "sched:", schedule);

    const job = await scheduleService.scheduleJob(req.body); //passes in ruleMongObj
    //console.log("job response:", job);
    res.status(201).json({ message: 'Job scheduled', job });
    } catch (error) {
    console.error('Error scheduling job:', error);
    res.status(500).json({ error: error.message });
    }
});

// Update an existing job
router.put('/schedule/:id', async (req, res) => {
  try {
    const { rule, schedule } = req.body;
    const jobId = req.params.id;

    const job = await scheduleService.updateJob(jobId, rule, schedule);
    res.status(200).json({ message: 'Job updated', job });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel a job
router.delete('/schedule/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    //console.log("Deleting job with id", jobId);
    await scheduleService.cancelJob(jobId);
    res.status(200).json({ message: 'Job canceled' });
  } catch (error) {
    console.error('Error canceling job:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
