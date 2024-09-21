import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PlatformChannelComponent from './PlatformChannelComponent';

function FeedModalComponent({ showFeedModal, toggleFeedModal, handleCreateFeed }) {
    const [feedName, setFeedName] = useState('');
    const [feedDescription, setFeedDescription] = useState('');
    const [feedPrompt, setFeedPrompt] = useState('');
    const [scheduleType, setScheduleType] = useState('immediately');
    const [scheduleTime, setScheduleTime] = useState('');
    const [customSchedule, setCustomSchedule] = useState([{ day: '', time: '' }]);
    const [platforms, setPlatforms] = useState([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [dailyTime, setDailyTime] = useState('');
    const [weeklyDay, setWeeklyDay] = useState('Monday');
    const [weeklyTime, setWeeklyTime] = useState('08:00');
    const [selectedChannels, setSelectedChannels] = useState({});

    const resetForm = () => {
        setFeedName('');
        setFeedDescription('');
        setFeedPrompt('');
        setScheduleType('immediately');
        setScheduleTime('');
        setDailyTime('');
        setWeeklyDay('Monday');  // Default to 'Monday' or another sensible default
        setWeeklyTime('08:00');  // Default time
        setCustomSchedule([{ day: '', time: '' }]);
        setSelectedChannels({});
        setSelectedPlatforms([]);
        fetchPlatforms();
    };
    
    const handleCloseModal = () => {
        resetForm();
        toggleFeedModal();  // Assuming this prop is a function to toggle modal visibility
    };


    const fetchPlatforms = async () => {
        try {
            const { data } = await axios.get('http://localhost:3001/v1/platform/connected', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            console.log(data);
            if (data){
                const platformNames = data.map(platform => platform.name);
                const uniqueNames = Array.from(new Set(platformNames));
                console.log("names", uniqueNames);
                setPlatforms(uniqueNames);
            } else {
                console.error("No Platform data");
            } 
        } catch (error) {
            console.error('Error fetching connected platforms:', error);
            setPlatforms([]);
        }
    };

    useEffect(() => {
        fetchPlatforms();
    }, []);

    const parseSchedule = (scheduleType, dailyTime, weeklyDay, weeklyTime, customSchedule) => {
        const schedule = {};
        switch (scheduleType) {
          case 'daily':
            const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            daysOfWeek.forEach(day => {
              schedule[day] = dailyTime;
            });
            break;
          case 'weekly':
            schedule[weeklyDay] = weeklyTime;
            break;
          case 'custom':
            customSchedule.forEach(item => {
              if (item.day && item.time) {
                schedule[item.day] = item.time;
              }
            });
            break;
          default:
            // Handle immediately or other types if necessary
            break;
        }
        return schedule;
      };

      const handleAddPlatform = (platform) => {
        setSelectedPlatforms(prevPlatforms => {
            if (!prevPlatforms.includes(platform)) {
                setPlatforms(prev => prev.filter(p => p !== platform));
                return [...prevPlatforms, platform];
            }
            return prevPlatforms;
        });
        setSelectedChannels(prev => ({
            ...prev,
            [platform]: []  // Initialize an empty array for the newly added platform
        }));
    };

    const handleRemovePlatform = (platform) => {
        setPlatforms(prev => [...prev, platform]);
        setSelectedPlatforms(prevPlatforms => prevPlatforms.filter(p => p !== platform));
        setSelectedChannels(prev => {
            const {[platform]: removed, ...remaining} = prev;  // Destructure to omit the removed platform's channels
            return remaining;
        });
    };

    const handleChannelUpdate = (platform, channels) => {
        setSelectedChannels(prev => {
            const newState = { ...prev, [platform]: channels };
            console.log(`New state for ${platform}:`, newState);
            return newState;
        });
    };

const collectSelectedChannelsJSON = () => {
    return Object.entries(selectedChannels).map(([platformName, chatIds]) => ({
        platformName: platformName,
        chatIds: chatIds
    }));
};

    const handleSubmit = (e) => {
        e.preventDefault();
        const channelsData = collectSelectedChannelsJSON();

        // Check for required fields based on the schedule type
        if (!feedName || !feedDescription) {
            alert('Please fill all required fields.');
            return;
        }
        
        if (scheduleType === 'daily' && !dailyTime) {
            alert('Please specify the daily time.');
            return;
        }
        
        if (scheduleType === 'weekly' && (!weeklyDay || !weeklyTime)) {
            alert('Please specify both the weekly day and time.');
            return;
        }
        
        if (scheduleType === 'custom' && customSchedule.some(item => !item.day || !item.time)) {
            alert('Please complete all custom schedule entries.');
            return;
        }

        const scheduleJSON = parseSchedule(scheduleType, dailyTime, weeklyDay, weeklyTime, customSchedule);

        handleCreateFeed({
            feedName,
            feedDescription,
            feedPrompt,
            schedule: JSON.stringify(scheduleJSON), // Passing the schedule as a stringified JSON
            Components: channelsData // This can be removed if not needed
        });

        // Reset form after submission
        resetForm();
    };

    const handleAddCustomSchedule = () => {
        setCustomSchedule([...customSchedule, { day: '', time: '' }]);
    };

    const handleRemoveCustomSchedule = (index) => {
        const updatedSchedules = customSchedule.filter((_, idx) => idx !== index);
        setCustomSchedule(updatedSchedules);
    };

    const handleCustomScheduleChange = (index, field, value) => {
        const updatedSchedule = [...customSchedule];
        updatedSchedule[index][field] = value;
        setCustomSchedule(updatedSchedule);
    };

    return (
        <div>
            {showFeedModal && (
                <div className="modal show d-block" tabIndex="-1" role="dialog" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add a New Feed</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={handleCloseModal}>
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="form-row">
                                        <label htmlFor="feedName" className="col-sm-3 col-form-label">Feed Name</label>
                                        <div className="col-sm-9">
                                            <input type="text" className="form-control" id="feedName" value={feedName} onChange={(e) => setFeedName(e.target.value)} placeholder="Enter feed name" required />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <label htmlFor="feedDescription" className="col-sm-3 col-form-label">Feed Description</label>
                                        <div className="col-sm-9">
                                            <textarea className="form-control" id="feedDescription" value={feedDescription} onChange={(e) => setFeedDescription(e.target.value)} rows="3" placeholder="Enter feed description" required />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <label htmlFor="feedPrompt" className="col-sm-3 col-form-label">Feed Prompt</label>
                                        <div className="col-sm-9">
                                            <input type="text" className="form-control" id="feedPrompt" value={feedPrompt} onChange={(e) => setFeedPrompt(e.target.value)} placeholder="Optional prompt for feed" />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <label htmlFor="scheduleType" className="col-sm-3 col-form-label">Schedule Type</label>
                                        <div className="col-sm-9">
                                            <select className="form-select" id="scheduleType" value={scheduleType} onChange={(e) => setScheduleType(e.target.value)}>
                                                <option value="immediately">Immediately</option>
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="custom">Custom</option>
                                            </select>
                                        </div>
                                    </div>
                                    {scheduleType === 'daily' && (
                                        <div className="form-row">
                                            <label htmlFor="dailyTime" className="col-sm-3 col-form-label">Daily Time</label>
                                            <div className="col-sm-9">
                                                <input type="time" className="form-control" id="dailyTime" value={dailyTime} onChange={(e) => setDailyTime(e.target.value)} placeholder="HH:MM" required />
                                            </div>
                                        </div>
                                    )}
                                    {scheduleType === 'weekly' && (
                                        <div className="form-row">
                                            <label htmlFor="weeklyDay" className="col-sm-3 col-form-label">Weekly Day</label>
                                            <div className="col-sm-4">
                                                <select className="form-select" id="weeklyDay" value={weeklyDay} onChange={(e) => setWeeklyDay(e.target.value)}>
                                                    <option value="Monday">Monday</option>
                                                    <option value="Tuesday">Tuesday</option>
                                                    <option value="Wednesday">Wednesday</option>
                                                    <option value="Thursday">Thursday</option>
                                                    <option value="Friday">Friday</option>
                                                    <option value="Saturday">Saturday</option>
                                                    <option value="Sunday">Sunday</option>
                                                </select>
                                            </div>
                                            <label htmlFor="weeklyTime" className="col-sm-2 col-form-label">Time</label>
                                            <div className="col-sm-3">
                                                <input type="time" className="form-control" id="weeklyTime" value={weeklyTime} onChange={(e) => setWeeklyTime(e.target.value)} placeholder="HH:MM" required />
                                            </div>
                                        </div>
                                    )}
                                    {scheduleType === 'custom' && customSchedule.map((schedule, index) => (
                                        <div key={index} className="form-row align-items-end">
                                            <div className="col-sm-4">
                                                <input type="text" className="form-control" value={schedule.day} onChange={(e) => handleCustomScheduleChange(index, 'day', e.target.value)} placeholder="Enter custom day" required />
                                            </div>
                                            <div className="col-sm-4">
                                                <input type="time" className="form-control" value={schedule.time} onChange={(e) => handleCustomScheduleChange(index, 'time', e.target.value)} placeholder="HH:MM" required />
                                            </div>
                                            <div className="col-sm-4">
                                                <button type="button" className="btn btn-danger" onClick={() => handleRemoveCustomSchedule(index)}>Remove</button>
                                            </div>
                                        </div>
                                    ))}
                                    {scheduleType === 'custom' && (
                                        <button type="button" className="btn btn-link" onClick={handleAddCustomSchedule}>Add Another Time</button>
                                    )}
                                    <div className="form-row">
                                        <div className="col-sm-9 offset-sm-3">
                                            <button type="submit" className="btn btn-primary">Create Feed</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="mb-3">
                                <label>Platforms</label>
                                <select className="form-control" onChange={(e) => handleAddPlatform(e.target.value)} value="">
                                    <option value="">Select a Platform</option>
                                    {platforms.map(platform => (
                                        <option key={platform} value={platform}>{platform}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                {selectedPlatforms.map(platform => (
                                    <PlatformChannelComponent 
                                    key={platform} 
                                    platform={platform} 
                                    handleRemovePlatform={handleRemovePlatform} 
                                    updateChannelSelection={handleChannelUpdate} 
                                    />
                                ))}
                            </div>
                                
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={toggleFeedModal}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


export default FeedModalComponent;

