const axios = require('axios');
const { ObjectId } = require('mongodb');

const options = {
    timeZone: 'America/New_York', // EST Time Zone
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true // for 12-hour format
};

function calculateNextRunTime(schedule) {
    const now = new Date();

    if (schedule.frequency === 'once') {
        return new Date(schedule.date);
    }

    if (schedule.frequency === 'daily') {
        const times = schedule.dailyTimes.map(timeStr => {
            const dateTime = new Date(timeStr);
            // Create a Date object with today's date but with the time from dateTime
            return new Date(now.getFullYear(), now.getMonth(), now.getDate(), dateTime.getHours(), dateTime.getMinutes());
        });

        // Filter times to get those in the future today
        const nextTimes = times.filter(time => time >= now);

        if (nextTimes.length > 0) {
            return nextTimes[0];
        }

        // If no future times today, pick the earliest time tomorrow
        const earliestTimeToday = times.sort((a, b) => a - b)[0];
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), earliestTimeToday.getHours(), earliestTimeToday.getMinutes());
    }

    if (schedule.frequency === 'weekly') {
        const times = schedule.weeklyTimes.map(({ day, time }) => {
            const dateTime = new Date(time);
            const nextRunDate = new Date(now);
            let dayDifference = (day - now.getDay() + 7) % 7;

            const dateTimeString = dateTime.toTimeString().slice(0,5);
            const nowTimeString = now.toTimeString().slice(0,5);
            // If it's the same day but the time has passed, move to the next occurrence
            if (dayDifference === 0 && dateTimeString < nowTimeString) {
                //console.log(dateTimeString, nowTimeString);
                dayDifference = 7;
            }

            nextRunDate.setDate(now.getDate() + dayDifference);
            nextRunDate.setHours(dateTime.getHours(), dateTime.getMinutes(), 0, 0);

            return nextRunDate;
        });

        const nextTimes = times.sort((a, b) => a - b).filter(time => time > now);

        if (nextTimes.length > 0) {
            return nextTimes[0];
        }

        return times[0];
    }


    if (schedule.frequency === 'custom') {
        const times = schedule.customTimes.map(timeStr => new Date(timeStr));
        const nextTimes = times.filter(time => time > now);
        return nextTimes.length > 0 ? nextTimes[0] : null;
    }
    throw new Error('Invalid schedule frequency');
}

class ScheduleService {
    constructor(agenda) {
      this.agenda = agenda;
    }


  
    async scheduleJob(ruleMongObj) {
        
        console.log(ruleMongObj._id);

        const jobName = `execute rule`;
        console.log("MongRuleObj SCHED JOB START:",  JSON.stringify(ruleMongObj, null, 2));

        const { rule } = ruleMongObj;
        const {schedule} = rule;

        if (ruleMongObj.jobId) {
            // If job exists, update it
            //console.log("existing found updating rule");
            let jobId = ObjectId.isValid(ruleMongObj.jobId) ? new ObjectId(ruleMongObj.jobId) : ruleMongObj.jobId;
            let existingJob = await this.agenda.jobs({ _id: jobId });
            console.log("existing job:", existingJob);
            if (existingJob.length > 0) {
                //console.log("MongRuleObj SCHED JOB END:",  JSON.stringify(ruleMongObj, null, 2));
                return this.updateJob(existingJob[0], ruleMongObj);
            } 
        }

        console.log("no existing creating new");
        let job = this.agenda.create(jobName, {ruleMongObj: ruleMongObj});
        this.applySchedule(job, schedule);

        await job.save();
        await this.updateRuleJobId(ruleMongObj._id, job.attrs._id);
        //console.log("MongRuleObj SCHED JOB END:",  JSON.stringify(ruleMongObj, null, 2));
        return job;
    }
  
    async updateJob(job, ruleMongObj) {
        const { rule } = ruleMongObj;
        const { schedule } = rule;

        

        // Update job data
        job.attrs.data.ruleMongObj = ruleMongObj;

        //console.log("UPDATE JOB RULE:",  JSON.stringify(job.attrs.data.ruleMongObj, null, 2));
        //console.log("updating job:", job, schedule);
        // Apply new schedule to the job
        this.applySchedule(job, schedule);


        //console.log("FINiSHED UPDATE JOB RULE:",  JSON.stringify(job.attrs.data.ruleMongObj, null, 2));
        await job.save();
        return job;
        }


    

    applySchedule(job, schedule) {
        const nextRunTime = calculateNextRunTime(schedule);
    
        if (nextRunTime) {
            console.log("Next run at (EST):", nextRunTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));
            job.schedule(nextRunTime);
        } else {
            console.error("No valid next run time found.");
        }
    }
  
    async cancelJob(jobId) {
        try {
          // Validate jobId
          if (!jobId) {
            console.error('No jobId provided.');
            return;
          }
      
          // Convert jobId to ObjectId if necessary
          let jobIdObject;
          if (ObjectId.isValid(jobId)) {
            jobIdObject = new ObjectId(jobId);
          } else {
            console.error(`Invalid jobId format: ${jobId}`);
            return;
          }
      
          // Check if the job exists
          const jobs = await this.agenda.jobs({ _id: jobIdObject });
      
          if (jobs.length === 0) {
            console.log(`No job found with ID ${jobId}`);
          } else {
            console.log(`Job found with ID ${jobId}. Proceeding to cancel.`);
      
            // Proceed to cancel the job
            const result = await this.agenda.cancel({ _id: jobIdObject });
      
            console.log(`Number of jobs canceled: ${result}`);
          }
        } catch (error) {
          console.error(`Error canceling job with ID ${jobId}:`, error);
          throw error;
        }
      }

    async updateRuleJobId(ruleId, jobId) {
        try {
            const response = await axios.put(`http://localhost:3001/v1/rules/${ruleId}/jobId`, { jobId });
            console.log("Rule's jobId updated successfully:", response.data);
        } catch (error) {
            console.error("Failed to update rule's jobId:", error.message);
            throw error;
        }
    }
  }
  
  module.exports = ScheduleService;
  