import React, { useState } from 'react';
import Switch from 'react-switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; 
import axiosInstance from '../../utils/axiosInstance';

function RuleCard({ rule, onToggle }) {
    const [isActive, setIsActive] = useState(rule.isActive || false);
    const navigate = useNavigate();
    const { auth } = useAuth(); // Get auth context
  
    const handleToggle = async (checked) => {
      const action = checked ? 'activate' : 'deactivate';
      const confirmMessage = `Are you sure you want to turn this rule ${checked ? 'on' : 'off'}?`;
    
      if (window.confirm(confirmMessage)) {
        try {
          const userId = auth.user.id;
          const url = `/rules/${rule._id}/${action}`;
    
          const response = await axiosInstance.put(url, { userId });
    
          if (response.status === 200) {
            setIsActive(checked);
            onToggle(rule._id, checked);
          } else {
            alert(`Failed to ${action} rule: ${response.data.error}`);
            // Revert the switch
            setIsActive(!checked);
          }
        } catch (error) {
          console.error('Error:', error);
          if (error.response && error.response.data && error.response.data.error) {
            alert(`Failed to ${action} rule: ${error.response.data.error}`);
          } else {
            alert(`An error occurred while trying to ${action} the rule.`);
          }
          // Revert the switch
          setIsActive(!checked);
        }
      } else {
        // User canceled the action, revert the switch
        setIsActive(!checked);
      }
    };
    
  
    const handleEdit = () => {
      const cond = rule.rule;
      navigate(`/edit-rule/${rule._id}`, { state: { cond } });
    };
  
    return (
      <div className="card w-100">
        <div className="card-body d-flex flex-column">
          <h5 className="card-title text-center">
            {rule.rule.name}
          </h5>
          <div className="mt-auto d-flex justify-content-between align-items-center">
            <button className="btn btn-primary" onClick={handleEdit}>Edit</button>
            <Switch
              onChange={handleToggle}
              checked={isActive}
              onColor="#86d3ff"
              onHandleColor="#2693e6"
              handleDiameter={30}
              uncheckedIcon={false}
              checkedIcon={false}
              boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
              activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
              height={20}
              width={48}
              className="react-switch"
              id="material-switch"
            />
          </div>
        </div>
      </div>
    );
  }
  
  export default RuleCard;
