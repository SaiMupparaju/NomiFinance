import React, { useState, useEffect, useRef } from 'react';
import { Button, Container, Dropdown } from 'react-bootstrap';
import IfSection from './IfSection';
import Swal from 'sweetalert2';
import axiosInstance from '../../utils/axiosInstance';
import '../styles/IfSection.css';
//import { fetchBankAccounts } from '../../utils/plaid_api';
import { generateFacts } from '../../utils/FactGenerator';
import {useAuth} from "../../contexts/AuthContext";


function MainIfSection({ onConditionsChange, conditions, accountProperties, setMainIfIsValid }) {
  const [mainOP, setMainOP] = useState("all");
  const initializedRef = useRef(false);

  const {auth} = useAuth();
  
  const [ifSections, setIfSections] = useState({
    conditions: {
      all: [
        {
          all: [{
            fact: '',
            operator: '---',
            value: 0,
            params: {}
          }],
          ifOP: 'all',
        }
      ],
    },
    operator: 'AND',
  });

  const [validityArray, setValidityArray] = useState([false]); // Tracks the validity of each section

  const updateValidity = (sectionIndex, isValid) => { //update the 
    const updatedValidityArray = [...validityArray];
    updatedValidityArray[sectionIndex] = isValid;
    setValidityArray(updatedValidityArray);

    // Check if the entire section is valid
    const allValid = updatedValidityArray.every(valid => valid === true);
    setMainIfIsValid(allValid); // Pass validity to the parent if needed
  };


  useEffect(() => {
    console.log("Current JSON State:", JSON.stringify(ifSections, null, 2));
  }, [ifSections]);

  const addCondition = (sectionIndex) => {
    const updatedSections = {
      ...ifSections,
      conditions: {
        ...ifSections.conditions,
        [mainOP]: ifSections.conditions[mainOP].map((section, idx) =>
          idx === sectionIndex
            ? {
                ...section,
                [section.ifOP || 'all']: [
                  ...section[section.ifOP || 'all'],
                  { fact: '', path: '', operator: '---', value: '' }
                ]
              }
            : section
        )
      }
    };
  
    setIfSections(updatedSections);
    onConditionsChange(updatedSections);
  };

  const addIfSection = () => {
    const updatedSections = {
        ...ifSections, // Copy the existing ifSections object
        conditions: {
            ...ifSections.conditions, // Copy the existing conditions object
            [mainOP]: [
                ...ifSections.conditions[mainOP], // Copy the existing array of sections in the mainOP
                {
                    all: [
                        {
                            fact: '',
                            operator: 'greaterThanInclusive',
                            value: 0,
                        }
                    ],
                    ifOP: "all" // Default to "all" for the new section
                }
            ]
        }
    };


    setIfSections(updatedSections); // Update the state with the new structure
    onConditionsChange(updatedSections); // Call the function to handle the updated conditions
  };

  const updateCondition = (sectionIndex, conditionIndex, key, value) => {
    setIfSections((prevIfSections) => {
        let newKey = key;
        let newValue = value;

        if (key === 'fact') {
            newKey = 'fact';
        } else if (key === 'value' && typeof value === 'string' && value !== "Custom Value") {
            newValue = { fact: value }; // Wrap the value in { fact: value } if it's a reference to another fact
        }

        const updatedSections = {
            ...prevIfSections,
            conditions: {
                ...prevIfSections.conditions,
                [mainOP]: prevIfSections.conditions[mainOP].map((section, idx) =>
                    idx === sectionIndex
                        ? {
                              ...section,
                              [section.ifOP || 'all']: section[section.ifOP || 'all'].map((cond, cidx) => {
                                  if (cidx === conditionIndex) {
                                      // Handle 'value.params' separately
                                      if (newKey === 'value.params') {
                                          return {
                                              ...cond,
                                              value: {
                                                  ...cond.value,
                                                  params: {
                                                      ...cond.value.params,
                                                      ...newValue, // Merge the existing params with new params
                                                  },
                                              },
                                          };
                                      } else {
                                          return { ...cond, [newKey]: newValue }; // Update the specific condition
                                      }
                                  }
                                  return cond;
                              }),
                          }
                        : section
                ),
            },
        };

        onConditionsChange(updatedSections); // Call the function to handle the updated conditions

        return updatedSections; // Return the updated sections to update the state
    });
};

  const updateOperatorMain = (newOperator) => {
    const newMainOP = newOperator === "AND" ? "all" : "any";
  
    const updatedSections = {
      ...ifSections,
      conditions: {
        ...ifSections.conditions,
        [newMainOP]: ifSections.conditions[mainOP], // Move the current mainOP contents to the new mainOP
      },
    };
  
    // Clear out the previous mainOP conditions
    delete updatedSections.conditions[mainOP];
  
    // Set the new main operator
    setMainOP(newMainOP);
  
    // Update the operator in the sections
    const finalSections = {
      ...updatedSections,
      operator: newOperator,
    };
  
    setIfSections(finalSections);
    onConditionsChange(finalSections);
  };

  const updateThisOperator = (sectionIndex, newOperator) => {
    const updatedSections = {
      ...ifSections,
      conditions: {
        ...ifSections.conditions,
        [mainOP]: ifSections.conditions[mainOP].map((section, idx) => {
          if (idx !== sectionIndex) {
            return section;
          }
  
          // Move the conditions to the new operator group (all or any)
          const temp = section[section.ifOP || 'all'];
  
          const updatedSection = {
            ...section,
            [newOperator === 'AND' ? 'all' : 'any']: temp,
            ifOP: newOperator === 'AND' ? 'all' : 'any',
          };
  
          // Remove the old operator group
          delete updatedSection[section.ifOP || 'all'];
  
          return updatedSection;
        }),
      },
    };
  
    setIfSections(updatedSections);
    onConditionsChange(updatedSections);
  };

  const removeCondition = (sectionIndex, conditionIndex) => {
    const updatedSections = {
      ...ifSections,
      conditions: {
        ...ifSections.conditions,
        [mainOP]: ifSections.conditions[mainOP].map((section, idx) => {
          if (idx !== sectionIndex) {
            return section;
          }
  
          const ifOP = section.ifOP || "all";
          const updatedConditionGroup = section[ifOP].filter((_, cidx) => cidx !== conditionIndex);
  
          // Return the updated section
          return {
            ...section,
            [ifOP]: updatedConditionGroup,
          };
        }),
      },
    };
  
    setIfSections(updatedSections);
    onConditionsChange(updatedSections);
  };

  const removeIfSection = (index) => {
    const updatedSections = {
      ...ifSections,
      conditions: {
        ...ifSections.conditions,
        [mainOP]: ifSections.conditions[mainOP].filter((_, idx) => idx !== index),
      },
    };
  
    setIfSections(updatedSections);
    onConditionsChange(updatedSections);
  };

  // New function to handle showing the "Coming Soon" alert
  const showComingSoonAlert = () => {
    Swal.fire({
      title: 'Coming Soon!',
      text: 'This feature is not yet available. Stay tuned!',
      icon: 'info',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'swal2-popup-custom' // You can customize the alert further via CSS classes
      }
    });
  };

  const handleCustomizeClick = () => {
    Swal.fire({
      title: 'Feature Request',
      input: 'textarea',
      inputLabel: 'Let us know what features you\'d like to see in the future',
      inputPlaceholder: 'Type your suggestion here...',
      inputAttributes: {
        'aria-label': 'Type your suggestion here'
      },
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        const suggestion = result.value;
        // Send the suggestion to the backend API
        axiosInstance.post('/suggest/api/suggestions', { suggestion })
          .then(response => {
            Swal.fire('Thank you!', 'Your suggestion has been submitted.', 'success');
          })
          .catch(error => {
            Swal.fire('Error', 'There was an error submitting your suggestion. Please try again later.', 'error');
            console.error('Error submitting suggestion:', error);
          });
      }
    });
  };
  
  return (
    <div className="if-section p-3 mb-3 bg-light border rounded">
      <div className="condition-buttons mb-3">
        <Button variant="outline-warning" className="me-2">
          EVENT
        </Button>
        <Button variant="outline-secondary" className="me-2"  onClick={showComingSoonAlert}> 
          TIMER
        </Button>
        {(auth.user) &&
        <Button variant="outline-secondary"  onClick={handleCustomizeClick}>
          CUSTOMIZE
        </Button>
        }
      </div>
      <Container>
        {/* MAP though the IF STATEMENTS */}
        {ifSections.conditions[mainOP].map((section, sectionIndex) => ( 
          <div key={sectionIndex}>
            {/* Iterate through each condition group based on ifOP */}

            <IfSection
              key={sectionIndex}
              section={section} // Pass the individual condition
              sectionIndex={sectionIndex} // Index of the section in ifSections
              accountProperties={accountProperties}
              updateCondition={(sectionIndex, conditionIndex, key, value) =>
                updateCondition(sectionIndex, conditionIndex, key, value)
              }
              addCondition={() => addCondition(sectionIndex)}
              removeCondition={(sectionIndex, conditionIndex) =>
                removeCondition(sectionIndex, conditionIndex)
              }
              updateOperator={(newOperator) => updateOperatorMain(newOperator)}
              removeIfSection={() => removeIfSection(sectionIndex)} // Pass the sectionIndex here
              updateThisOperator={(sectionIndex, newOperator) => updateThisOperator(sectionIndex, newOperator)}
              mainOP={mainOP}

            />

            {/* Add dropdown to change the operator between sections if needed */}
            {sectionIndex < ifSections.conditions[mainOP].length - 1 && (
              <Dropdown onSelect={(e) => updateOperatorMain(e)}>
                <Dropdown.Toggle variant="info" className="my-2">
                  {mainOP==="all" ? "AND" : "OR"} {/* Display the current main operator */}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item eventKey="AND">AND</Dropdown.Item>
                  <Dropdown.Item eventKey="OR">OR</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </div>
        ))}
        <Button variant="outline-primary" size="sm" onClick={addIfSection}>
          Add If
        </Button>
      </Container>
    </div>
  );
}

export default MainIfSection;