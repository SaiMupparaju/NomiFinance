import React, { useState } from 'react';
import Switch from 'react-switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; 
import axiosInstance from '../../utils/axiosInstance';
import Swal from 'sweetalert2'; // Import SweetAlert2
import withReactContent from 'sweetalert2-react-content';
import { SketchPicker } from 'react-color';
import { FaPalette, FaTrash } from 'react-icons/fa'; 

function RuleCard({ rule, onToggle, activeRulesCount, subscriptionLimit, onDelete}) {
    const [isActive, setIsActive] = useState(rule.isActive || false);
    const navigate = useNavigate();
    const { auth } = useAuth(); // Get auth context
    const MySwal = withReactContent(Swal);
    const [color, setColor] = useState(rule.color || '#ffffff');
    const [showColorPicker, setShowColorPicker] = useState(false);

    const handleColorChange = async (newColor) => {
      setColor(newColor.hex);
    
      try {
        const response = await axiosInstance.put(`/rules/${rule._id}/color`, { color: newColor.hex });
    
        if (response.status === 200) {
          // Optionally, show a success message
          //MySwal.fire('Success!', 'Rule color updated.', 'success');
        } else {
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
      // Show SweetAlert2 confirmation dialog
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
              setIsActive(!checked); // Revert the switch
            }
          } catch (error) {
            console.error('Error:', error);
            MySwal.fire(
              'Error!',
              `An error occurred while trying to ${action} the rule.`,
              'error'
            );
            setIsActive(!checked); // Revert the switch
          }
        } else {
          setIsActive(!checked); // User canceled the action, revert the switch
        }
      });
    };
    
  
    const handleEdit = () => {
      const cond = rule.rule;
      navigate(`/edit-rule/${rule._id}`, { state: { cond } });
    };

    const handleDelete = () => {
      // Show SweetAlert2 confirmation dialog
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
              // Notify parent component to remove this rule from the list
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
      <div className="card w-100 rounded" style={{ backgroundColor: color }}>
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start">
            <h5 className="card-title">{rule.rule.name}</h5>
            <div className="d-flex align-items-center">
              <FaTrash
                style={{ cursor: 'pointer', marginRight: '10px', color: 'grey' }}
                onClick={handleDelete}
              />
              <div className="color-picker-container" style={{ position: 'relative' }}>
                <FaPalette
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                {showColorPicker && (
                  <div style={{ position: 'absolute', zIndex: 2, right: 0 }}>
                    <div
                      style={{ position: 'fixed', top: 0, left: 0, bottom: 0, right: 0 }}
                      onClick={() => setShowColorPicker(false)}
                    />
                    <SketchPicker color={color} onChangeComplete={handleColorChange} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-auto d-flex justify-content-between align-items-center">
            <button className="btn btn-primary" onClick={handleEdit}>
              Edit
            </button>
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
