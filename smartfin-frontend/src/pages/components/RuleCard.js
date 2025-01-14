// src/pages/components/RuleCard.js

import React, { useState } from 'react';
import Switch from 'react-switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; 
import axiosInstance from '../../utils/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { SketchPicker } from 'react-color';
import { FaPalette, FaTrash } from 'react-icons/fa'; 

function RuleCard({ rule, onToggle, activeRulesCount, subscriptionLimit, onDelete }) {
  const [isActive, setIsActive] = useState(rule.isActive || false);
  const navigate = useNavigate();
  const { auth } = useAuth();
  const MySwal = withReactContent(Swal);

  const [color, setColor] = useState(rule.color || '#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Sleeker card style
  const baseCardStyle = {
    position: 'relative',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    padding: '20px',
    width: '100%',
    backgroundColor: color
  };

  // Distinguish applet from custom with a border
  const borderStyle = rule.isApplet ? '2px solid #17a2b8' : '1px solid #ccc';
  const cardStyle = {
    ...baseCardStyle,
    border: borderStyle
  };

  const handleColorChange = async (newColor) => {
    setColor(newColor.hex);
    try {
      const response = await axiosInstance.put(`/rules/${rule._id}/color`, { color: newColor.hex });
      if (response.status !== 200) {
        throw new Error('Failed to update rule color');
      }
    } catch (error) {
      console.error('Error updating rule color:', error);
      MySwal.fire('Error!', 'An error occurred while updating the rule color.', 'error');
    }
  };

  const handleToggle = async (checked) => {
    const action = checked ? 'activate' : 'deactivate';

    if (checked && activeRulesCount >= subscriptionLimit) {
      await MySwal.fire({
        title: 'Subscription Limit Reached',
        text: `You have reached the limit of ${subscriptionLimit} active rules for your subscription. Please deactivate another rule or upgrade your subscription.`,
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      setIsActive(false);
      return;
    }

    MySwal.fire({
      title: `Are you sure?`,
      text: `Do you want to turn this rule ${checked ? 'on' : 'off'}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${checked ? 'turn it on' : 'turn it off'}!`
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const userId = auth.user.id;
          const url = `/rules/${rule._id}/${action}`;
  
          const response = await axiosInstance.put(url, { userId });
          if (response.status === 200) {
            setIsActive(checked);
            onToggle(rule._id, checked);
            MySwal.fire(
              'Success!',
              `The rule has been ${checked ? 'activated' : 'deactivated'}.`,
              'success'
            );
          } else {
            MySwal.fire(
              'Error!',
              `Failed to ${action} rule: ${response.data.error}`,
              'error'
            );
            setIsActive(!checked); 
          }
        } catch (error) {
          console.error('Error:', error);
          MySwal.fire(
            'Error!',
            `An error occurred while trying to ${action} the rule.`,
            'error'
          );
          setIsActive(!checked); 
        }
      } else {
        setIsActive(!checked); 
      }
    });
  };

  const handleEdit = () => {
    if (rule.isApplet) {
      const cond = {
        rule: rule.rule,
        isApplet: rule.isApplet,
        appletId: rule.appletId,
        appletInputs: rule.appletInputs,
        _id: rule._id
      };
      navigate('/applet-form', { state: { cond } });
    } else {
      const cond = rule.rule;
      navigate(`/edit-rule/${rule._id}`, { state: { cond } });
    }
  };

  const handleDelete = () => {
    MySwal.fire({
      title: `Delete Rule`,
      text: `Are you sure you want to delete this rule? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: `Yes, delete it!`,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axiosInstance.delete(`/rules/${rule._id}`);
          if (response.status === 200) {
            onDelete(rule._id);
            MySwal.fire('Deleted!', 'Your rule has been deleted.', 'success');
          } else {
            MySwal.fire('Error!', 'Failed to delete rule.', 'error');
          }
        } catch (error) {
          console.error('Error deleting rule:', error);
          MySwal.fire('Error!', 'An error occurred while deleting the rule.', 'error');
        }
      }
    });
  };

  return (
    <div style={cardStyle}>
      {/* If it's an APPLET, put a badge in the top-left corner */}
      {rule.isApplet && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            left: '20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            borderRadius: '8px',
            padding: '4px 8px',
            fontSize: '0.75rem'
          }}
        >
          APPLET
        </div>
      )}

      {/* Icons in the top-right corner */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
          display: 'flex', 
          gap: '10px' 
        }}
      >
        <FaTrash
          style={{ cursor: 'pointer', color: '#444', fontSize: '1.1rem' }}
          onClick={handleDelete}
        />
        <FaPalette
          style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#444' }}
          onClick={() => setShowColorPicker(!showColorPicker)}
        />
        {showColorPicker && (
          <div style={{ position: 'absolute', zIndex: 200, top: '30px', right: 0 }}>
            <div
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0
              }}
              onClick={() => setShowColorPicker(false)}
            />
            <SketchPicker 
              color={color} 
              onChangeComplete={handleColorChange} 
            />
          </div>
        )}
      </div>

      {/* Container for the rule name, with extra top margin & center alignment */}
      <div 
        className="title-container" 
        style={{ marginTop: '30px', textAlign: 'center' }}
      >
        <h4 
          style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            marginBottom: '15px' 
          }}
        >
          {rule.rule.name}
        </h4>
      </div>

      {/* Bottom row: the "Edit" button on the left, toggle switch on the right */}
      <div className="d-flex justify-content-between align-items-center">
        <button className="btn btn-primary btn-sm" onClick={handleEdit}>
          Edit
        </button>

        <Switch
          onChange={handleToggle}
          checked={isActive}
          onColor="#86d3ff"
          onHandleColor="#2693e6"
          handleDiameter={26}
          uncheckedIcon={false}
          checkedIcon={false}
          boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
          activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
          height={20}
          width={48}
          className="react-switch"
          id={`rule-switch-${rule._id}`}
        />
      </div>
    </div>
  );
}

export default RuleCard;
