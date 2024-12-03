// src/utils/schedulerApi.js
const axios = require('axios');

const schedulerApiUrl = process.env.SCHEDULE_URL;
const taskerApiKey = process.env.TASKER_API_KEY; // The token stored in your Lambda's environment variables

const scheduleJob = async (rule) => {
  try {
    const response = await axios.post(`${schedulerApiUrl}`, rule, {
      headers: {
        'Authorization': `Bearer ${taskerApiKey}`, // Send the token as a Bearer token
      },
    });
    console.log('Response data from scheduler API:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error scheduling job:', error.message);
    throw error;
  }
};

const cancelJob = async (jobId) => {
  try {
    const response = await axios.delete(`${schedulerApiUrl}/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${taskerApiKey}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error canceling job:', error.message);
    throw error;
  }
};

module.exports = {
  scheduleJob,
  cancelJob,
};
