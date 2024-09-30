// src/index.js
//const calculateNextRunTime = req
const app = require('./app');
const agenda = require('./agenda');

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`Scheduler server running on http://localhost:${PORT}`);
});

// const sched = {
//   frequency: "weekly",
//   timeZone: "America/Chicago", // Desired time zone
//   userLocalTimeZone: "America/New_York", // User's local time zone
//   weeklyTimes: [
//     {
//       day: 1, // Monday
//       time: "Sun Aug 25 2024 16:22:00 GMT-0400 (Eastern Daylight Time)"
//     },
//     {
//       day: 1, // Monday
//       time: "Sun Aug 25 2024 16:39:00 GMT-0400 (Eastern Daylight Time)"
//     }
//   ]
// };

// function calculateNextRunTime(schedule) {
//   const {
//     frequency,
//     date,
//     dailyTimes,
//     weeklyTimes,
//     customTimes,
//     timeZone,
//     userLocalTimeZone,
//   } = schedule;

//   // Current time in the desired timeZone
//   const now = DateTime.now().setZone(timeZone);

//   if (frequency === 'once') {
//     // Parse the date provided by the user
//     const dateTime = DateTime.fromJSDate(new Date(date));

//     // Extract date and time components
//     const year = dateTime.year;
//     const month = dateTime.month;
//     const day = dateTime.day;
//     const hour = dateTime.hour;
//     const minute = dateTime.minute;
//     const second = dateTime.second;
//     const millisecond = dateTime.millisecond;

//     // Create the scheduled date in the desired timeZone
//     const scheduledDate = DateTime.fromObject(
//       {
//         year,
//         month,
//         day,
//         hour,
//         minute,
//         second,
//         millisecond,
//       },
//       { zone: timeZone }
//     );

//     if (scheduledDate <= now) {
//       return null; // Scheduled time has already passed
//     }

//     return scheduledDate.toUTC().toJSDate(); // Return as JavaScript Date in UTC
//   }

//   if (frequency === 'daily') {
//     const times = dailyTimes.map((timeStr) => {
//       // Parse the time string to extract hour and minute
//       const dateTime = DateTime.fromJSDate(new Date(timeStr));

//       // Extract hour and minute
//       const hour = dateTime.hour;
//       const minute = dateTime.minute;

//       // Set the next run time in the desired timeZone
//       let nextRun = now.set({
//         hour,
//         minute,
//         second: 0,
//         millisecond: 0,
//       });

//       // If the time has already passed today, schedule for tomorrow
//       if (nextRun <= now) {
//         nextRun = nextRun.plus({ days: 1 });
//       }

//       return nextRun;
//     });

//     // Get the earliest next run time
//     const nextRunTime = times.sort((a, b) => a - b)[0];
//     return nextRunTime.toUTC().toJSDate(); // Return as JavaScript Date in UTC
//   }

//   if (frequency === 'weekly') {

//     const times = weeklyTimes.map(({ day, time }) => {
//       // Parse the time string to extract hour and minute
//       const dateTime = DateTime.fromJSDate(new Date(time));

//       // Extract hour and minute
//       const hour = dateTime.hour;
//       const minute = dateTime.minute;

//       // Set the next run time in the desired timeZone
//       let nextRun = now.set({
//         weekday: day === 0 ? 7 : day, // Luxon weekdays: 1 (Monday) to 7 (Sunday)
//         hour,
//         minute,
//         second: 0,
//         millisecond: 0,
//       });

//       // If the time has already passed this week, schedule for next week
//       if (nextRun <= now) {
//         nextRun = nextRun.plus({ weeks: 1 });
//       }

//       return nextRun;
//     });

//     // Get the earliest next run time
//     const nextRunTime = times.sort((a, b) => a - b)[0];
//     return nextRunTime.toJSDate(); // Return as JavaScript Date in UTC
//   }

//   if (frequency === 'custom') {
//     const times = customTimes.map(({ date: dateStr, time: timeStr }) => {
//       // Parse the date and time strings
//       const datePart = DateTime.fromJSDate(new Date(dateStr));
//       const timePart = DateTime.fromJSDate(new Date(timeStr));

//       // Combine date and time components
//       const combinedDateTime = DateTime.fromObject(
//         {
//           year: datePart.year,
//           month: datePart.month,
//           day: datePart.day,
//           hour: timePart.hour,
//           minute: timePart.minute,
//           second: timePart.second,
//           millisecond: timePart.millisecond,
//         },
//         { zone: timeZone }
//       );

//       return combinedDateTime;
//     });

//     // Filter times that are in the future
//     const nextTimes = times.filter((time) => time > now);

//     if (nextTimes.length > 0) {
//       const nextRunTime = nextTimes.sort((a, b) => a - b)[0];
//       return nextRunTime.toUTC().toJSDate(); // Return as JavaScript Date in UTC
//     }
//     return null;
//   }

//   throw new Error('Invalid schedule frequency');
// }


// const compare = calculateNextRunTime(sched);
// const estOptions = {
//   timeZone: 'America/New_York', // Displaying in Eastern Time
//   year: 'numeric',
//   month: 'long',
//   day: 'numeric',
//   hour: 'numeric',
//   minute: 'numeric',
//   second: 'numeric',
//   hour12: true
// };
// const compareInEST = new Intl.DateTimeFormat('en-US', estOptions).format(compare);
// console.log("Index.js compare  in (EST):", compareInEST);

