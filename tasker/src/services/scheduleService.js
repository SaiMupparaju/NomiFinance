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

const { DateTime } = require('luxon');

function calculateNextRunTime(schedule, ruleEvaluatedTrueToday = false) {
  const {
    frequency,
    date,
    dailyTimes,
    weeklyTimes,
    customTimes,
    timeZone,
    userLocalTimeZone,
  } = schedule;

  // Current time in the desired timeZone
  const now = DateTime.now().setZone(timeZone);

  if (frequency === 'ontruth') {

    const ontruthTimes = [
      { hour: 9, minute: 0 },
      { hour: 12, minute: 0 },
      { hour: 15, minute: 0 },
      { hour: 18, minute: 0 },
    ];

    // Check if the rule evaluated to true today
    //let ruleEvaluatedTrueToday = false;
    // if (lastEvaluatedTrueDate) {
    //   const lastTrueDate = DateTime.fromJSDate(lastEvaluatedTrueDate).setZone(timeZone);
    //   ruleEvaluatedTrueToday = lastTrueDate.hasSame(now, 'day');
    // }

    if (ruleEvaluatedTrueToday) {
      // Schedule for tomorrow at the earliest time
      const earliestTime = ontruthTimes[0];
      let nextRun = now.plus({ days: 1 }).set({
        hour: earliestTime.hour,
        minute: earliestTime.minute,
        second: 0,
        millisecond: 0,
      });

      return nextRun.toUTC().toJSDate();
    }

    // Find the next run time among the fixed times
    let nextTimes = ontruthTimes.map((time) => {
      let nextRun = now.set({
        hour: time.hour,
        minute: time.minute,
        second: 0,
        millisecond: 0,
      });

      // If the time has already passed today, schedule for the next available time
      if (nextRun <= now) {
        nextRun = nextRun.plus({ days: 1 });
      }

      return nextRun;
    });

    // Filter out times that have already passed today
    nextTimes = nextTimes.filter((time) => time > now);

    if (nextTimes.length === 0) {
      // All times have passed today, schedule for tomorrow at the earliest time
      const earliestTime = ontruthTimes[0];
      let nextRun = now.plus({ days: 1 }).set({
        hour: earliestTime.hour,
        minute: earliestTime.minute,
        second: 0,
        millisecond: 0,
      });

      return nextRun.toUTC().toJSDate();
    } else {
      // Schedule for the next available time today
      const nextRun = nextTimes.sort((a, b) => a - b)[0];
      return nextRun.toUTC().toJSDate();
    }
  }

  if (frequency === 'once') {
    // Parse the date provided by the user
    const dateTime = DateTime.fromJSDate(new Date(date));

    // Extract date and time components
    const year = dateTime.year;
    const month = dateTime.month;
    const day = dateTime.day;
    const hour = dateTime.hour;
    const minute = dateTime.minute;
    const second = dateTime.second;
    const millisecond = dateTime.millisecond;

    // Create the scheduled date in the desired timeZone
    const scheduledDate = DateTime.fromObject(
      {
        year,
        month,
        day,
        hour,
        minute,
        second,
        millisecond,
      },
      { zone: timeZone }
    );

    if (scheduledDate <= now) {
      return null; // Scheduled time has already passed
    }

    return scheduledDate.toUTC().toJSDate(); // Return as JavaScript Date in UTC
  }

  if (frequency === 'daily') {
    const times = dailyTimes.map((timeStr) => {
      // Parse the time string to extract hour and minute
      const dateTime = DateTime.fromJSDate(new Date(timeStr));

      // Extract hour and minute
      const hour = dateTime.hour;
      const minute = dateTime.minute;

      // Set the next run time in the desired timeZone
      let nextRun = now.set({
        hour,
        minute,
        second: 0,
        millisecond: 0,
      });

      // If the time has already passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun = nextRun.plus({ days: 1 });
      }

      return nextRun;
    });

    // Get the earliest next run time
    const nextRunTime = times.sort((a, b) => a - b)[0];
    return nextRunTime.toUTC().toJSDate(); // Return as JavaScript Date in UTC
  }

  if (frequency === 'weekly') {

    const times = weeklyTimes.map(({ day, time }) => {
      // Parse the time string to extract hour and minute
      const dateTime = DateTime.fromJSDate(new Date(time));

      // Extract hour and minute
      const hour = dateTime.hour;
      const minute = dateTime.minute;

      // Set the next run time in the desired timeZone
      let nextRun = now.set({
        weekday: day === 0 ? 7 : day, // Luxon weekdays: 1 (Monday) to 7 (Sunday)
        hour,
        minute,
        second: 0,
        millisecond: 0,
      });

      // If the time has already passed this week, schedule for next week
      if (nextRun <= now) {
        nextRun = nextRun.plus({ weeks: 1 });
      }

      return nextRun;
    });

    // Get the earliest next run time
    const nextRunTime = times.sort((a, b) => a - b)[0];
    return nextRunTime.toJSDate(); // Return as JavaScript Date in UTC
  }

  if (frequency === 'custom') {
    const times = customTimes.map(({ date: dateStr, time: timeStr }) => {
      // Parse the date and time strings
      const datePart = DateTime.fromJSDate(new Date(dateStr));
      const timePart = DateTime.fromJSDate(new Date(timeStr));

      // Combine date and time components
      const combinedDateTime = DateTime.fromObject(
        {
          year: datePart.year,
          month: datePart.month,
          day: datePart.day,
          hour: timePart.hour,
          minute: timePart.minute,
          second: timePart.second,
          millisecond: timePart.millisecond,
        },
        { zone: timeZone }
      );

      return combinedDateTime;
    });

    // Filter times that are in the future
    const nextTimes = times.filter((time) => time > now);

    if (nextTimes.length > 0) {
      const nextRunTime = nextTimes.sort((a, b) => a - b)[0];
      return nextRunTime.toUTC().toJSDate(); // Return as JavaScript Date in UTC
    }
    return null;
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
  