// src/agenda.js
require('dotenv').config();
const { Agenda } = require('agenda');
const { Engine } = require('json-rules-engine');
const axios = require('axios');
const emailService = require('./services/emailService');
const TextService = require('./services/smsService');
const mongoConnectionString = `${process.env.MONGO_CONNECTION_STRING}`;
const agenda = new Agenda({ db: { address: mongoConnectionString , collection: 'agendaJobs'} });
const backendBaseUrl = `${process.env.REACT_APP_BACKEND_API_URL}/v1`;
const crypto = require('crypto');
const rulesEngine = require('rules-engine');
const { DateTime } = require('luxon');
const ScheduleService = require('./services/scheduleService');
const ss = new ScheduleService(agenda);
//const emailService = new EmailService();

// Define the job for executing rules
const PROD = true;
const hourOffset = PROD === "PROD" ? 5 : 0;
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


const fetchFactValue = async (userId, factString, params) => {
  try {
    const response = await axios.post(`${backendBaseUrl}/fact/fact-value`, {
      userId: userId,
      factString: factString,
      params: params,
    }, {
      headers: {
        'x-api-key': 'Sophia', // API key in headers
      }
    });

    return response.data.factValue;
  } catch (error) {
    console.error('Error fetching fact value:', error);
    throw error;
  }
};




agenda.define('execute rule', async (job) => {
  console.log("running job");
  const { ruleMongObj } = job.attrs.data; // Accessing the job data attributes -- THIS IS THE FULL MONG OBJ
  const engine = new Engine();

  console.log("MongRuleObj:", JSON.stringify(ruleMongObj, null, 2));
  const condition = Array.isArray(ruleMongObj.rule.conditions.all)
    ? ruleMongObj.rule.conditions.all
    : [ruleMongObj.rule.conditions.all];

  console.log("condition", condition);
  const engineParam = {
    conditions: {
      all: condition,
    },
    event: ruleMongObj.rule.event,
  };

  // Step 1: Move conditions to all and wrap it in an array
  if (engineParam.conditions.all[0].conditions) {
    engineParam.conditions.all[0].all = [engineParam.conditions.all[0].conditions];

    // Step 2: Delete the conditions key
    delete engineParam.conditions.all[0].conditions;

    // Step 3: Remove the operator key from the inner object
    if (engineParam.conditions.all[0].all[0].operator) {
      delete engineParam.conditions.all[0].all[0].operator;
    }
  }

  console.log("passing this into engine:", JSON.stringify(engineParam, null, 2));
  engine.addRule(engineParam);

  try {
    // Track facts we've already seen to avoid redundant definitions
    const seenFacts = {};

    // Function to dynamically register facts in the engine
    const registerFact = (fact, params) => {
      if (!seenFacts[fact]) {
        seenFacts[fact] = true;
        engine.addFact(fact, async (params) => {
          console.log(`Fetching fact ${fact} with params`, { ...params, ruleId: ruleMongObj._id });
          const factValue = await fetchFactValue(ruleMongObj.subscriberId, fact, { ...params, ruleId: ruleMongObj._id });
          console.log(`Fetched value for ${fact}:`, factValue);
          return factValue;
        });
      }
    };

    // Recursive function to process the condition and register facts
    const processCondition = async (condition) => {
      if (condition.fact) {
        const { fact, params = {} } = condition;
        //params.ruleId = ruleMongObj._id; 
        // Dynamically register the fact with the engine
        console.log("registering fact, ruleId", ruleMongObj._id);
        console.log("passed in params:",  { ...params, ruleId: ruleMongObj._id });
        registerFact(fact, { ...params, ruleId: ruleMongObj._id });

        // Handle nested facts in value
        if (condition.value && condition.value.fact) {
          const nestedFact = condition.value.fact;
          const nestedParams = condition.value.params || {};
          // Dynamically register the nested fact with the engine
          registerFact(nestedFact, { ...nestedParams, ruleId: ruleMongObj._id });
        }
      }

      // Recursively handle nested conditions (all/any)
      if (condition.all) {
        for (let subCondition of condition.all) {
          await processCondition(subCondition);
        }
      }

      if (condition.any) {
        for (let subCondition of condition.any) {
          await processCondition(subCondition);
        }
      }
    };

    // Process all conditions to register necessary fact values dynamically
    for (let condition of engineParam.conditions.all) {
      await processCondition(condition);
    }

    // Run the engine (fact values will be fetched dynamically when needed)
    const result = await engine.run();

    const ruleEvaluatedTrue = result.events && result.events.length > 0;
    if (ruleEvaluatedTrue) {
      console.log('Rule evaluated to TRUE. Events:', result.events);

      // **Handle Notifications:**
      const event = ruleMongObj.rule.event;
      if (event && event.params) {
        const { phone_numbers, emails, message } = event.params;

        // If the event type includes "Text", send SMS
        if (event.type.includes("Text") && phone_numbers && phone_numbers.length > 0) {
          for (const phoneNumber of phone_numbers) {
            await TextService.sendText(phoneNumber, message);
            console.log(`Sent text to ${phoneNumber}`);
          }
        }

        // If the event type includes "Email", send Emails
        if (event.type.includes("Email") && emails && emails.length > 0) {
          for (const email of emails) {
            await emailService.sendEmail(email, 'Notification', message);
            console.log(`Sent email to ${email}`);
          }
        }
      }
    } else {
      console.log('Rule did not evaluate to TRUE, no events triggered.');
    }

    ruleMongObj.lastExecuted = new Date();


    // Calculate and reschedule the next job run
    const nextRunTime = calculateNextRunTime(ruleMongObj.rule.schedule, ruleEvaluatedTrueToday=ruleEvaluatedTrue);
    if (nextRunTime) {
      job.schedule(nextRunTime); // Reschedule the job
      await job.save(); // Save the updated job
      console.log('Next run at:', nextRunTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    } else {
      console.log('No next run time calculated. Job will not be rescheduled.');
    }
  } catch (err) {
    console.error('Error running rule engine:', err);
  }
});



agenda.on('ready', async () => {
  const { DateTime } = require('luxon');
  console.log("Agenda started up testing next date function...");
  console.log("backend", process.env.REACT_APP_BACKEND_API_URL);

  const sched = {
    frequency: "daily",
    timeZone: "America/New_York", // Desired time zone
    userLocalTimeZone: "America/Los_Angeles", // User's local time zone
    dailyTimes: ["2024-12-06T18:00:00.000Z"]
    //dailyTimes: ["Sun Dec 6 2024 11:00:00 GMT-0400 (Eastern Daylight Time)"],
    //dailyTimes: ["Fri Dec 06 2024 11:00:00 GMT-0500 (Eastern Standard Time)"]
    
  };

  const weeklyTimes = sched.weeklyTimes;
  const timeZone = sched.timeZone;
  const now = DateTime.now().setZone(timeZone);

  let nextRunTime = calculateNextRunTime(sched, lastEvaluatedTrueDate=true);
  console.log("Returned nextRunTime (Luxon DateTime):", nextRunTime);
  //let nextRunTimeSS = ss.getNext(sched, lastEvaluatedTrueDate=true);

  if (nextRunTime) {
    // Convert nextRunTime to a JavaScript Date object in UTC
    console.log("Verifying nextRunTime.toUTC():", nextRunTime.toUTC().toString());
    console.log("Verifying nextRunTime.toISO():", nextRunTime.toISO());
    console.log("Verifying nextRunTime in JS Date:", nextRunTime.toJSDate());
    const nextRunDate = nextRunTime;
   //const nextRunDateSS = nextRunTimeSS;

    // Convert the nextRunDate to a more readable format
    const estOptions = {
      timeZone: 'America/New_York', // Displaying in Eastern Time
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    };

    const nextRunInEST = new Intl.DateTimeFormat('en-US', estOptions).format(nextRunDate);
    //sconst nextRunSSInEST = new Intl.DateTimeFormat('en-US', estOptions).format(nextRunDateSS);
    console.log("Next run at (EST):", nextRunInEST);
    //console.log("Next run (EST) SS:", nextRunSSInEST);

    //emailService.sendEmail('saivamsim26@gmail.com', 'Tasker Service', "this is a test");

    // Now you can use nextRunDate with Agenda
  } else {
    console.log("No valid next run time found.");
  }
});

module.exports = agenda;
