import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaQuestionCircle } from 'react-icons/fa';
import { tz } from 'moment-timezone'; // Import moment-timezone for timezone handling

// Example of time zones you can provide as options
const timeZoneOptions = [
  { label: 'Eastern Time (EST)', value: 'America/New_York' },
  { label: 'Central Time (CST)', value: 'America/Chicago' },
  { label: 'Pacific Time (PST)', value: 'America/Los_Angeles' },
  { label: 'UTC', value: 'UTC' },
  // Add more time zones as necessary
];

function parseDate(dateString) {
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  return date;
}

function ExecuteSection({ schedule = {}, setSchedule, isNewRule }) {
  console.log("/execute-section", schedule);

  const daysOfWeek = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
  ];

  const [frequency, setFrequency] = useState(schedule.frequency || '');
  const [selectedDate, setSelectedDate] = useState(parseDate(schedule.date || new Date()));
  const [timeZone, setTimeZone] = useState(schedule.timeZone || 'UTC'); // Add timezone state

  const [dailyTimes, setDailyTimes] = useState(
    schedule.dailyTimes ? schedule.dailyTimes.map(timeObj => ({
      ...timeObj,
      time: parseDate(timeObj.time)
    })) : []
  );

  useEffect(() => {
    const userLocalTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setSchedule((prevSchedule) => ({ ...prevSchedule, userLocalTimeZone }));
  }, [setSchedule]);

  const [weeklyTimes, setWeeklyTimes] = useState(
    schedule.weeklyTimes ? schedule.weeklyTimes.map(timeObj => ({
      ...timeObj,
      time: parseDate(timeObj.time)
    })) : []
  );

  const [monthlyOptions, setMonthlyOptions] = useState(schedule.monthlyOptions || { firstOfMonth: false, lastOfMonth: false });
  const [customTimes, setCustomTimes] = useState(
    schedule.customTimes ? schedule.customTimes.map(timeObj => ({
      date: parseDate(timeObj.date),
      time: parseDate(timeObj.time)
    })) : [{ date: new Date(), time: new Date() }]
  );

  useEffect(() => {
    if (dailyTimes && dailyTimes.length > 0) {
      const needsUpdate = dailyTimes.some(time => !(time instanceof Date));

      if (needsUpdate) {
        const updatedDailyTimes = dailyTimes.map(time => time instanceof Date ? time : new Date(time));
        setDailyTimes(updatedDailyTimes);
      }
    }
    console.log("daily times:", dailyTimes, dailyTimes[0] instanceof Date);
  }, [dailyTimes]);

  useEffect(() => {
    console.log("weekly times:", weeklyTimes);
  }, [weeklyTimes]);

  useEffect(() => {
    // Update internal state to reflect changes in the schedule prop
    console.log("freq useEffect", frequency);
    setFrequency(schedule.frequency || 'daily');
    setSelectedDate(parseDate(schedule.date) || new Date());
    const parsedDailyTimes = schedule.dailyTimes ? schedule.dailyTimes.map(parseDate) : [new Date()];
    setDailyTimes(parsedDailyTimes);
    setWeeklyTimes(schedule.weeklyTimes ? schedule.weeklyTimes.map(timeObj => ({
      ...timeObj,
      time: parseDate(timeObj.time)
    })) : []);
    setMonthlyOptions(schedule.monthlyOptions || { firstOfMonth: false, lastOfMonth: false });
    setCustomTimes(schedule.customTimes ? schedule.customTimes.map(timeObj => ({
      date: parseDate(timeObj.date),
      time: parseDate(timeObj.time)
    })) : [{ date: new Date(), time: new Date() }]);

    // Set the time zone if available in the schedule
    setTimeZone(schedule.timeZone || 'UTC');
  }, [schedule, frequency]);

  const resetPreviousFrequencyValues = () => {
    setSchedule((prevSchedule) => ({
      ...prevSchedule,
      date: null,
      dailyTimes: null,
      weeklyTimes: null,
      monthlyOptions: null,
      customTimes: null,
    }));
  };

  const handleFrequencyChange = (e) => {
    const newFrequency = e.target.value;
    resetPreviousFrequencyValues();
    if (newFrequency === "once") {
      setSelectedDate(new Date());
    }
    setFrequency(newFrequency);
    setSchedule((prevSchedule) => ({ ...prevSchedule, frequency: newFrequency }));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSchedule((prevSchedule) => ({ ...prevSchedule, date }));
  };

  const handleTimeZoneChange = (e) => {
    const selectedTimeZone = e.target.value;
    setTimeZone(selectedTimeZone);
    setSchedule((prevSchedule) => ({ ...prevSchedule, timeZone: selectedTimeZone }));
  };

  const handleDailyTimeChange = (index, time) => {
    const updatedDailyTimes = dailyTimes.map((t, i) => (i === index ? time : t));
    setDailyTimes(updatedDailyTimes);
    setSchedule((prevSchedule) => ({ ...prevSchedule, dailyTimes: updatedDailyTimes }));
  };

  const handleAddDailyTime = () => {
    const newDailyTimes = [...dailyTimes, new Date()];
    setDailyTimes(newDailyTimes);
    setSchedule((prevSchedule) => ({ ...prevSchedule, dailyTimes: newDailyTimes }));
  };

  const handleRemoveDailyTime = (index) => {
    const updatedDailyTimes = dailyTimes.filter((_, i) => i !== index);
    setDailyTimes(updatedDailyTimes);
    setSchedule((prevSchedule) => ({ ...prevSchedule, dailyTimes: updatedDailyTimes }));
  };

  const handleAddWeeklyTime = () => {
    const newWeeklyTimes = [...weeklyTimes, { day: 0, time: new Date() }];
    setWeeklyTimes(newWeeklyTimes);
    setSchedule((prevSchedule) => ({ ...prevSchedule, weeklyTimes: newWeeklyTimes }));
  };

  const handleRemoveWeeklyTime = (index) => {
    const updatedWeeklyTimes = weeklyTimes.filter((_, i) => i !== index);
    setWeeklyTimes(updatedWeeklyTimes);
    setSchedule((prevSchedule) => ({ ...prevSchedule, weeklyTimes: updatedWeeklyTimes }));
  };

  const handleWeeklyTimeChange = (index, key, value) => {
    const updatedWeeklyTimes = weeklyTimes.map((timeObj, i) =>
      i === index ? { ...timeObj, [key]: value } : timeObj
    );
    setWeeklyTimes(updatedWeeklyTimes);
    setSchedule((prevSchedule) => ({ ...prevSchedule, weeklyTimes: updatedWeeklyTimes }));
  };

  const handleMonthlyChange = (option, checked) => {
    const updatedOptions = { ...monthlyOptions, [option]: checked };
    setMonthlyOptions(updatedOptions);
    setSchedule((prevSchedule) => ({ ...prevSchedule, monthlyOptions: updatedOptions }));
  };

  const handleAddCustomTime = () => {
    const newCustomTimes = [...customTimes, { date: new Date(), time: new Date() }];
    setCustomTimes(newCustomTimes);
    setSchedule((prevSchedule) => ({ ...prevSchedule, customTimes: newCustomTimes }));
  };

  const handleRemoveCustomTime = (index) => {
    const updatedTimes = customTimes.filter((_, i) => i !== index);
    setCustomTimes(updatedTimes);
    setSchedule((prevSchedule) => ({ ...prevSchedule, customTimes: updatedTimes }));
  };

  const handleCustomDateChange = (index, date) => {
    const updatedTimes = customTimes.map((time, i) =>
      i === index ? { ...time, date } : time
    );
    setCustomTimes(updatedTimes);
    setSchedule((prevSchedule) => ({ ...prevSchedule, customTimes: updatedTimes }));
  };

  const handleCustomTimeChange = (index, time) => {
    const updatedTimes = customTimes.map((timeObj, i) =>
      i === index ? { ...timeObj, time } : timeObj
    );
    setCustomTimes(updatedTimes);
    setSchedule((prevSchedule) => ({ ...prevSchedule, customTimes: updatedTimes }));
  };

  useEffect(() => {
    if (isNewRule) {
      handleFrequencyChange({ target: { value: 'daily' } });
      handleAddDailyTime();
    }
  }, [isNewRule]);

  return (
    <Card className="p-3 mb-3 bg-white border rounded">
      <Form.Group controlId="executionFrequency">
        <Form.Label>How often should this rule execute?</Form.Label>
        <Form.Control as="select" value={frequency} onChange={handleFrequencyChange}>
          <option value="once">Once</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="ontruth">Whenever Rule is True</option>
          <option value="custom">Custom Time</option>
        </Form.Control>
      </Form.Group>

      {frequency === 'ontruth' && (
        <Form.Group controlId="onTruthTooltip" className="mt-3">
          <OverlayTrigger
            placement="right"
            overlay={<Tooltip id="tooltip-right">We will check to see if the above conditions are met whenever your account information updates.</Tooltip>}
          >
            <span className="d-inline-block">
              <FaQuestionCircle style={{ fontSize: '1.2rem', cursor: 'pointer', color: '#007bff' }} />
            </span>
          </OverlayTrigger>
        </Form.Group>
      )}

      {((frequency !== 'ontruth')) && (
      <Form.Group controlId="timeZone" className="mt-3">
        <Form.Label>What timezone are you in?</Form.Label>
        <Form.Control as="select" value={timeZone} onChange={handleTimeZoneChange}>
          {timeZoneOptions.map((tzOption) => (
            <option key={tzOption.value} value={tzOption.value}>
              {tzOption.label}
            </option>
          ))}
        </Form.Control>
      </Form.Group>
      )}

      {frequency === 'once' && (
        <Form.Group controlId="executeDate" className="mt-3">
          <Form.Label>Select Date and Time:</Form.Label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            showTimeSelect
            timeIntervals={10}
            timeCaption="Time"
            dateFormat="MMMM d, yyyy h:mm aa"
          />
        </Form.Group>
      )}

      {frequency === 'daily' && (
        <Form.Group controlId="executeTime" className="mt-3">
          <Form.Label>Select Times:</Form.Label>
          {dailyTimes.map((time, index) => (
            <Row key={index} className="align-items-center mb-2">
              <Col md={3}>
                <DatePicker
                  selected={time}
                  onChange={(newTime) => handleDailyTimeChange(index, newTime)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={1}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                />
              </Col>
              <Col md={2}>
                <Button variant="danger" onClick={() => handleRemoveDailyTime(index)}>
                  Remove
                </Button>
              </Col>
            </Row>
          ))}
          <Button variant="outline-primary" onClick={handleAddDailyTime}>
            Add Time
          </Button>
        </Form.Group>
      )}

      {frequency === 'weekly' && (
        <>
          <Form.Group controlId="executeWeekly" className="mt-3">
            <Form.Label>Add Day and Time:</Form.Label>
            {weeklyTimes.map((schedule, index) => (
              <Row key={index} className="align-items-center mb-2">
                <Col md={3}>
                  <Form.Control
                    as="select"
                    value={schedule.day}
                    onChange={(e) => handleWeeklyTimeChange(index, 'day', parseInt(e.target.value, 10))}
                  >
                    {daysOfWeek.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </Form.Control>
                </Col>
                <Col md={3}>
                  <DatePicker
                    selected={schedule.time}
                    onChange={(newTime) => handleWeeklyTimeChange(index, 'time', newTime)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={1}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                  />
                </Col>
                <Col md={2}>
                  <Button variant="danger" onClick={() => handleRemoveWeeklyTime(index)}>
                    Remove
                  </Button>
                </Col>
              </Row>
            ))}
            <Button variant="outline-primary" onClick={handleAddWeeklyTime}>
              Add Day and Time
            </Button>
          </Form.Group>
        </>
      )}

      {frequency === 'monthly' && (
        <Form.Group controlId="executeMonthly" className="mt-3">
          <Form.Label>Select Date:</Form.Label>
          <Row>
            <Col md={4}>
              <Form.Check
                type="checkbox"
                label="First of Every Month"
                checked={monthlyOptions.firstOfMonth}
                onChange={(e) => handleMonthlyChange('firstOfMonth', e.target.checked)}
              />
            </Col>
            <Col md={4}>
              <Form.Check
                type="checkbox"
                label="Last of Every Month"
                checked={monthlyOptions.lastOfMonth}
                onChange={(e) => handleMonthlyChange('lastOfMonth', e.target.checked)}
              />
            </Col>
          </Row>
        </Form.Group>
      )}

      {frequency === 'custom' && (
        <>
          <Form.Group controlId="executeCustom" className="mt-3">
            <Form.Label>Add Date and Time:</Form.Label>
            {customTimes.map((custom, index) => (
              <Row key={index} className="align-items-center mb-2">
                <Col md={3}>
                  <Form.Label>Select Date: </Form.Label>
                  <DatePicker
                    selected={custom.date}
                    onChange={(date) => handleCustomDateChange(index, date)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label>Select Time: </Form.Label>
                  <DatePicker
                    selected={custom.time}
                    onChange={(time) => handleCustomTimeChange(index, time)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={1}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                  />
                </Col>
                <Col md={2}>
                  <Button variant="danger" onClick={() => handleRemoveCustomTime(index)}>
                    Remove
                  </Button>
                </Col>
              </Row>
            ))}
            <Button variant="outline-primary" onClick={handleAddCustomTime}>
              Add Date and Time
            </Button>
          </Form.Group>
        </>
      )}
    </Card>
  );
}

export default ExecuteSection;
