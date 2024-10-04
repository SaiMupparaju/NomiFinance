import React, { useState } from 'react';
import Switch from 'react-switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; 
import axiosInstance from '../../utils/axiosInstance';
import Swal from 'sweetalert2'; // Import SweetAlert2
import withReactContent from 'sweetalert2-react-content';

function RuleCard({ rule, onToggle }) {
    const [isActive, setIsActive] = useState(rule.isActive || false);
    const navigate = useNavigate();
    const { auth } = useAuth(); // Get auth context
    const MySwal = withReactContent(Swal);
  
    const handleToggle = async (checked) => {
      const action = checked ? 'activate' : 'deactivate';

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
