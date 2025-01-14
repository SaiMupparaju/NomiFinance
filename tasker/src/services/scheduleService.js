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
const PROD = true;
const hourOffset = PROD=== "PROD" ? 5 : 0;



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

      return nextRun;
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

      return nextRun;
    } else {
      // Schedule for the next available time today
      const nextRun = nextTimes.sort((a, b) => a - b)[0];
      return nextRun;
    }
  }

  if (frequency === 'once') {
    // Parse the date provided by the user
    const utcDateTime = DateTime.fromISO(date, { setZone: true });
    const userLocalDateTime = utcDateTime.setZone(userLocalTimeZone);
    const dateTime = userLocalDateTime.setZone(timeZone, { keepLocalTime: true });

    if (dateTime <= now) {
      return null; // Scheduled time has already passed
    }

    return dateTime;
  }

  if (frequency === 'daily') {
    const times = dailyTimes.map((timeStr) => {
      console.log(`\nProcessing Time String: ${timeStr}`);
      const utcDateTime = DateTime.fromISO(timeStr, { setZone: true }); 
      const userLocalDateTime = utcDateTime.setZone(userLocalTimeZone);
      console.log(`User Local DateTime (${userLocalTimeZone}): ${userLocalDateTime.toString()}`);

      const dateTime = userLocalDateTime.setZone(timeZone, { keepLocalTime: true });
      console.log(`Final DateTime in Target TimeZone (${timeZone}): ${dateTime.toString()}`);
      
      console.log(`Original Time String: ${timeStr}`);
      console.log(`Parsed DateTime in '${timeZone}': ${dateTime.toString()}`);
      console.log(`Hour: ${dateTime.hour}, Minute: ${dateTime.minute}`);

      // Extract hour and minute - this will be in UTC since the input is UTC
      const hour = dateTime.hour;
      const minute = dateTime.minute;

      const nowInTimeZone = now.setZone(timeZone);
      console.log(`Current Time in '${timeZone}': ${nowInTimeZone.toString()}`);

      // Create the next run time directly in the rule's specified timezone
      let nextRun = nowInTimeZone.set({
        hour,
        minute,
        second: 0,
        millisecond: 0
      });

      console.log(`Precheck NextRun in '${timeZone}': ${nextRun.toString()}`);  
      // If the time has already passed today in the rule's timezone, 
      // schedule for tomorrow in that same timezone
      if (nextRun <= nowInTimeZone) {
        nextRun = nextRun.plus({ days: 1 });
        console.log("Next Run Adjusted to Tomorrow");
      }
      console.log(`Next Run DateTime in '${timeZone}': ${nextRun.toString()}`);
  
      return nextRun;
    });
  
    // Get the earliest next run time
    const nextRunTime = times.sort((a, b) => a - b)[0];
    return nextRunTime;
  }

  if (frequency === 'weekly') {
    const times = weeklyTimes.map(({ day, time }) => {
      // Parse the time string to extract hour and minute
      const utcDateTime = DateTime.fromISO(time, { setZone: true });
      const userLocalDateTime = utcDateTime.setZone(userLocalTimeZone);
      const dateTime = userLocalDateTime.setZone(timeZone, { keepLocalTime: true });

      const hour = dateTime.hour;
      const minute = dateTime.minute;

      const nowInTimeZone = now.setZone(timeZone);

      let nextRun = nowInTimeZone.set({
        weekday: day === 0 ? 7 : day, // Luxon weekdays: 1 (Monday) to 7 (Sunday)
        hour,
        minute,
        second: 0,
        millisecond: 0,
      });

      // If the time has already passed this week, schedule for next week
      if (nextRun <= nowInTimeZone) {
        nextRun = nextRun.plus({ weeks: 1 });
      }

      return nextRun;
    });

    // Get the earliest next run time
    const nextRunTime = times.sort((a, b) => a - b)[0];
    return nextRunTime;
  }

  if (frequency === 'custom') {
    const times = customTimes.map(({ date: dateStr, time: timeStr }) => {
      const utcDate = DateTime.fromISO(dateStr, { setZone: true });
      const utcTime = DateTime.fromISO(timeStr, { setZone: true });
      
      const userLocalDate = utcDate.setZone(userLocalTimeZone);
      const userLocalTime = utcTime.setZone(userLocalTimeZone);
      
      return DateTime.fromObject(
        {
          year: userLocalDate.year,
          month: userLocalDate.month,
          day: userLocalDate.day,
          hour: userLocalTime.hour,
          minute: userLocalTime.minute,
          second: 0,
          millisecond: 0
        },
        { zone: timeZone }
      );
    });

    // Filter times that are in the future
    const nextTimes = times.filter((time) => time > now);

    if (nextTimes.length > 0) {
      const nextRunTime = nextTimes.sort((a, b) => a - b)[0];
      return nextRunTime;
    }
    return null;
  }

  throw new Error('Invalid schedule frequency');
}

class ScheduleService {
    constructor(agenda) {
      this.agenda = agenda;
    }


     getNext(schedule, ruleEvaluatedTrueToday = false) {
      return calculateNextRunTime(schedule, ruleEvaluatedTrueToday);
    }

  
    async scheduleJob(ruleMongObj) {
      try {
        const jobName = `execute rule`;
  
        // Determine if job already exists
        if (ruleMongObj.jobId) {
          console.log("job exists");
          let jobId = ObjectId.isValid(ruleMongObj.jobId) ? new ObjectId(ruleMongObj.jobId) : ruleMongObj.jobId;
          let existingJob = await this.agenda.jobs({ _id: jobId });
          if (existingJob.length > 0) {
            return await this.updateJob(existingJob[0], ruleMongObj);
          }
        }
        
        console.log("creating a new job");
        // Create a new job
        let job = this.agenda.create(jobName, { ruleMongObj: ruleMongObj });
        this.applySchedule(job, ruleMongObj.rule.schedule);
  
        await job.save();
        console.log("returning job", JSON.stringify(job, null, 2));
        return job;
      } catch (error) {
        console.error('Error scheduling job in ScheduleService:', error);
        throw new Error('Failed to schedule job');
      }
    }
  
    async updateJob(job, ruleMongObj) {
        const { rule } = ruleMongObj;
        const { schedule } = rule;

        job.attrs.data.ruleMongObj = ruleMongObj;

        this.applySchedule(job, schedule);

        await job.save();
        return job;
      }


    

    applySchedule(job, schedule) {
        const nextRunTime = calculateNextRunTime(schedule);
    
        if (nextRunTime) {
            console.log("Next run at", nextRunTime.toISO());
            //console.log("Next run at (EST):", nextRunTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));
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
            const response = await axios.put(`${process.env.REACT_APP_BACKEND_API_URL}/v1/rules/${ruleId}/jobId`, { jobId });
            console.log("Rule's jobId updated successfully:", response.data);
        } catch (error) {
            console.error("Failed to update rule's jobId:", error.message);
            throw error;
        }
    }
  }
  
  module.exports = ScheduleService;
  