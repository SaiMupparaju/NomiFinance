// src/agenda.js
const { Agenda } = require('agenda');
const { Engine } = require('json-rules-engine');
const axios = require('axios');
const emailService = require('./services/emailService');
const TextService = require('./services/smsService');
const mongoConnectionString = 'mongodb://127.0.0.1:27017/node-boilerplate';
const agenda = new Agenda({ db: { address: mongoConnectionString , collection: 'agendaJobs'} });
const backendBaseUrl = 'http://localhost:3001/v1';
const crypto = require('crypto');
const rulesEngine = require('rules-engine');

// Define the job for executing rules

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
          console.log(`Fetching fact ${fact} with params`, params);
          const factValue = await fetchFactValue(ruleMongObj.subscriberId, fact, params);
          console.log(`Fetched value for ${fact}:`, factValue);
          return factValue;
        });
      }
    };

    // Recursive function to process the condition and register facts
    const processCondition = async (condition) => {
      if (condition.fact) {
        const { fact, params = {} } = condition;
        // Dynamically register the fact with the engine
        registerFact(fact, params);

        // Handle nested facts in value
        if (condition.value && condition.value.fact) {
          const nestedFact = condition.value.fact;
          const nestedParams = condition.value.params || {};
          // Dynamically register the nested fact with the engine
          registerFact(nestedFact, nestedParams);
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

    console.log('Executed rule. Events:', result.events);

    // Calculate and reschedule the next job run
    const nextRunTime = calculateNextRunTime(ruleMongObj.rule.schedule);
    if (nextRunTime) {
      job.schedule(nextRunTime); // Reschedule the job
      await job.save(); // Save the updated job
      console.log('Next run at (EST):', nextRunTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    } else {
      console.log('No next run time calculated. Job will not be rescheduled.');
    }
  } catch (err) {
    console.error('Error running rule engine:', err);
  }
});



agenda.on('ready', async () => {
    console.log("agenda started up testing next date function ...");
    const sched = {
        frequency: "weekly",
        weeklyTimes: [
        {
            day: 1,
            time:"Sun Aug 25 2024 00:22:00 GMT-0400 (Eastern Daylight Time)"
        },
        {
            day: 1,
            time: "Sun Aug 25 2024 00:39:00 GMT-0400 (Eastern Daylight Time)"
        }]
    };

    const next = calculateNextRunTime(sched);
    if (next) {
        const estOptions = {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true
        };
        const secret = crypto.randomBytes(64).toString('hex');
    console.log("secret", secret);

        const nextRunInEST = new Intl.DateTimeFormat('en-US', estOptions).format(next);
        console.log("Next run at (EST):", nextRunInEST);

        // Send a test email
        try {
            // await TextService.sendText(
            //     "+15712532500",
            //     "hehe"
            // );
        } catch (err) {
            console.error('Failed to send test email:', err);
        }
    } else {
        console.log("No valid next run time found.");
    }
});

module.exports = agenda;
