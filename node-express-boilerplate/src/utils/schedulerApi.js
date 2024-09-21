// src/utils/schedulerApi.js

const axios = require('axios');

const schedulerApiUrl = 'http://localhost:3002/schedule';

const scheduleJob = async (rule) => {
  try {
    console.log("trying to send to scheduler");
    const response = await axios.post(`${schedulerApiUrl}`, rule);
    return response.data;
  } catch (error) {
    console.error('Error scheduling job:', error.message);
    throw error;
  }
};

const cancelJob = async (jobId) => {
  try {
    const response = await axios.delete(`${schedulerApiUrl}/${jobId}`);
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