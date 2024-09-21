import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PlatformChannelComponent({ platform, handleRemovePlatform, updateChannelSelection  }) {
    const [channels, setChannels] = useState([]);
    const [visible, setVisible] = useState(true);
    const [selectedChannels, setSelectedChannels] = useState([]);

    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const { data } = await axios.get(`http://localhost:3001/v1/platform/${platform.toLowerCase()}/channels`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                console.log("Channels", data.channels);
                setChannels(data.channels);
            } catch (error) {
                console.error('Error fetching channels:', error);
            }
        };

        fetchChannels();
    }, [platform]);

    const handleToggleVisibility = () => {
        setVisible(!visible);
    };



    const handleChannelSelect = (channelId) => {
        setSelectedChannels(prevSelectedChannels => {
            const isAlreadySelected = prevSelectedChannels.includes(channelId);
            const updatedSelectedChannels = isAlreadySelected
                ? prevSelectedChannels.filter(id => id !== channelId)
                : [...prevSelectedChannels, channelId];
    
            updateChannelSelection(platform, updatedSelectedChannels);
            return updatedSelectedChannels;
        });
    };

    return (
        <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
                <h5 onClick={handleToggleVisibility}>{platform}</h5>
                <button className="btn btn-danger btn-sm" onClick={() => handleRemovePlatform(platform)}>Remove</button>
            </div>
            {visible && (
                <div>
                    {channels.length ? (
                        <ul className="list-unstyled">
                            {channels.map(channel => (
                                <li key={channel.id}>
                                    <input type="checkbox" checked={selectedChannels.includes(channel.id)} onChange={() => handleChannelSelect(channel.id)} /> {channel.name}
                                </li>
                            ))}
                        </ul>
                    ) : <p>No channels available.</p>}
                </div>
            )}
        </div>
    );
}

export default PlatformChannelComponent;
