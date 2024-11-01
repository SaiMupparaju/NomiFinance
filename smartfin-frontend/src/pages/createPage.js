import React, { useState, useMemo, useEffect} from 'react';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as necessary
import { useFact } from '../contexts/FactContext';
import { Container, Row, Col, Button, Alert, Accordion } from 'react-bootstrap';
import MainIfSection from './components/MainIfSection';
import ExecuteSection from './components/ExecuteSection';
import GoSection from './components/GoSection';
import EventSection from './components/EventSection';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/CreateRulePage.css';
import { createRule, getRuleById, updateRule } from '../utils/rule_api'; // Import the createRule function
//import {Button, Alert} from 'react-bootstrap';
import { getFactTree,getUserFacts } from '../utils/fact_api';

import Swal from 'sweetalert2';

function CreateRulePage() {
  const { auth } = useAuth();
  const { factTree, userFacts } = useFact();
  const { ruleId } = useParams(); // Get rule ID from URL if present
  const navigate = useNavigate();
  const location = useLocation();
  const userRules = location.state?.userRules || [];

  const [executionTime, setExecutionTime] = useState('immediately');
  const [ruleName, setRuleName] = useState('');
  const [conditions, setConditions] = useState([]);
  const [event, setEvent] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [schedule, setSchedule] = useState({ 
    events: [],
    view: 'timeGridWeek',
  });
  const [buttonText, setButtonText] = useState("Create Rule");
  const [mainIfIsValid, setMainIfIsValid] = useState(false);

// useEffect(() => {
//   console.log("fact tree", factTree);
//   console.log("user facts", userFacts);
// }, [factTree, userFacts]);

const initialEvent = useMemo(() => {
  if (location.state?.cond) {
    // Editing an existing rule
    return location.state.cond.event;
  } else {
    // Creating a new rule
    return {
      type: 'Notify Text',
      params: {
        emails: [],
        phone_numbers: [],
        message: '',
      },
    };
  }
}, [location.state]);

  useEffect(() => {
    // Example of preset values for the event state
    const presetEvent = {
      type: 'Notify Text',
      params: {
        recipients: ['1234567890'],
        message: 'Your notification message here',
      },
    };
    setEvent(presetEvent);
  }, []);

  useEffect(() => {
    console.log("main if conditions", conditions);
  }, [conditions]);

  useEffect(() => {
    if (location.state?.cond) {
      const fetchRuleData = async () => {
        console.log("/create-rule rule", location.state?.cond);
        // Check if rule data is passed via state
        const ruleData = location.state.cond;
        setRuleName(ruleData.name);
        setConditions(ruleData.conditions.all); //sets conditions to the value that mainif works with this is the if statements separated by operator
        setEvent(ruleData.event);
        setSchedule({ ...schedule, ...ruleData.schedule });
        setButtonText("Save Rule");
      };
      fetchRuleData();
    } 
  }, []);

  const checkConditionsValidity = (conditionGroup) => {
    // Check if the group is either an 'all' or 'any' condition group
    const operatorGroup = conditionGroup.all || conditionGroup.any;
  
    if (!operatorGroup || operatorGroup.length === 0) {
      return { isValid: false, message: 'No conditions specified.' };
    }
  
    // Iterate through each condition in the current operator group
    for (let condition of operatorGroup) {
      
      // Check if the condition itself is a nested group ('all' or 'any')
      if (condition.all || condition.any) {
        // Recursively validate the nested condition group
        const nestedResult = checkConditionsValidity(condition);
        if (!nestedResult.isValid) {
          return nestedResult; // Return early if the nested group is invalid
        }
      } else {
        // Validate the current atomic condition
  
        // Validate fact
        if (!condition.fact || condition.fact === '') {
          return { isValid: false, message: 'You forgot to tell us what to compare for one of your facts!' };
        }
  
        // Validate operator
        if (!condition.operator || condition.operator === '---') {
          return { isValid: false, message: 'A condition has an invalid operator.' };
        }
  
        // Validate value (ensure value is properly structured)
        if ((condition.value === null || condition.value === 0) && !condition.value.fact) {
          return { isValid: false, message: 'Of of your conditions is empty!' };
        }
  
        
        // Special validation for expenses categories
        if (condition.fact.includes('expenses') && (!condition.params || !condition.params.categories || condition.params.categories.length === 0)) {
          return { isValid: false, message: 'Expenses condition requires categories to be selected.' };
        }

        if (condition.value.fact.includes('expenses') && (!condition.value.params || !condition.value.params.categories || condition.value.params.categories.length === 0)) {
          return { isValid: false, message: 'Expenses condition requires categories to be selected.' };
        }
      }
    }
  
    // If no errors were found, return valid
    return { isValid: true, message: '' };
  };

  const validateRule = (rule) => {
    if (!rule.name) {
      return 'Please provide a rule name.';
    }

    // Validate conditions
    const conditionResult = checkConditionsValidity(rule.conditions.all.conditions);
    if (!conditionResult.isValid) {
      return conditionResult.message;
    }

    // Validate event
    if (!rule.event || !rule.event.params || (rule.event.params.emails.length === 0 && rule.event.params.phone_numbers?.length === 0)) {
      return 'You must specify a valid event with recipients';
    }

    if (!rule.event || !rule.event.params || rule.event.params.message.length === 0) {
      return 'Your message must be non-empty';
    }


    return ;
  };

  const handleCreateOrUpdateRule = async () => {
    if (!auth.user) {
      Swal.fire({
        title: 'Sign Up Required',
        text: 'Please sign up to start creating rules.',
        icon: 'info',
        confirmButtonText: 'Go to Sign Up',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/register');
        }
      });
      return;
    }
  
    const rule = {
      name: ruleName,
      conditions: { all: conditions },
      event: event,
      schedule: schedule,
    };
  
    const error = validateRule(rule);
    if (error) {
      setErrorMessage(error);
      return;
    }
  
    try {
      // Use the passed-in userRules instead of making an API call
      const activeRules = userRules.filter((rule) => rule.isActive);
  
      // Determine subscription limit
      let limit = 0;
      const subscriptionProductId = auth.user.subscriptionProductId;
  
      if (subscriptionProductId === 'prod_R0b23M9NcTgjfF') {
        limit = Infinity; // Premium has no limit
      } else if (subscriptionProductId === 'prod_R22J6iyXBxcFLX') {
        limit = 4; // Standard subscription limit
      } else if (subscriptionProductId === 'prod_R0auXMo4nOGFkM') {
        limit = 1; // Single subscription limit
      } else {
        limit = 0; // No subscription
      }
  
      let isActive = true;
  
      if (activeRules.length >= limit) {
        isActive = false;
        await Swal.fire({
          title: 'Subscription Limit Reached',
          text: `You have reached the limit of ${limit} active rules for your subscription. The rule will be created but turned off.`,
          icon: 'warning',
          confirmButtonText: 'OK',
        });
      }
  
      const newRuleData = {
        creatorId: auth.user.id,
        subscriberId: auth.user.id,
        rule: rule,
        isActive: isActive,
      };
  
      if (ruleId) {
        await updateRule(ruleId, newRuleData);
      } else {
        await createRule(newRuleData);
      }
      navigate('/home');
    } catch (error) {
      console.error('Failed to create/update rule:', error.message);
    }
  };

  return (
    <Container className="create-rule-container">
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Accordion defaultActiveKey={[]} alwaysOpen>

        <Accordion.Item eventKey="0" className="iff-section">
          <Accordion.Header>IF</Accordion.Header>
          <Accordion.Body>
            <MainIfSection
              onConditionsChange={setConditions}
              conditions={conditions}
              accountProperties={factTree}
              setMainIfIsValid={setMainIfIsValid}
            />
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="1" className="then-section">
          <Accordion.Header>THEN</Accordion.Header>
          <Accordion.Body>
            <EventSection presetEvent={initialEvent} onEventChange={setEvent} />
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="2" className="execute-section">
          <Accordion.Header>EXECUTE</Accordion.Header>
          <Accordion.Body>
            <ExecuteSection schedule={schedule} setSchedule={setSchedule} isNewRule={true} />
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="3" className="name-section">
          <Accordion.Header>NAME</Accordion.Header>
          <Accordion.Body>
            <GoSection ruleName={ruleName} setRuleName={setRuleName} />
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
      <div className="mt-3 text-end">
        <Button variant="primary" onClick={handleCreateOrUpdateRule}>
          {buttonText}
        </Button>
      </div>
    </Container>
  );
}

export default CreateRulePage;