import React, { useState, useEffect} from 'react';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as necessary
import { useFact } from '../contexts/FactContext';
import { Container, Row, Col } from 'react-bootstrap';
import MainIfSection from './components/MainIfSection';
import ExecuteSection from './components/ExecuteSection';
import GoSection from './components/GoSection';
import EventSection from './components/EventSection';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/CreateRulePage.css';
import { createRule, getRuleById, updateRule } from '../utils/rule_api'; // Import the createRule function
import {Button, Alert} from 'react-bootstrap';
import { getFactTree,getUserFacts } from '../utils/fact_api';
function CreateRulePage() {
  const { auth } = useAuth();
  const { factTree, userFacts } = useFact();
  const { ruleId } = useParams(); // Get rule ID from URL if present
  const navigate = useNavigate();
  const location = useLocation();

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

useEffect(() => {
  console.log("fact tree", factTree);
  console.log("user facts", userFacts);
}, [factTree, userFacts]);

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
    const rule = {
      name: ruleName,
      conditions: {all : conditions}, // Pass the entire conditions object
      event: event,
      schedule: schedule,
    };
    console.log("rule", rule);
    const error = validateRule(rule);
    if (error) {
      setErrorMessage(error);
      return;
    }

    try {
      if (ruleId) {
        await updateRule(ruleId, {
          creatorId: auth.user.id,
          subscriberId: auth.user.id,
          rule: rule,
        });
      } else {
        await createRule({
          creatorId: auth.user.id,
          subscriberId: auth.user.id,
          rule: rule,
        });
      }
      navigate('/home');
    } catch (error) {
      console.error('Failed to create/update rule:', error.message);
    }
  };

  return (
    <Container className="create-rule-container">
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Row>
        <Col><h3>IF</h3>
          <MainIfSection onConditionsChange={setConditions} conditions={conditions} accountProperties={factTree} setMainIfIsValid={setMainIfIsValid} />
        </Col>
      </Row>
      <Row>
        <Col><h3>THEN</h3>
          <EventSection presetEvent={event} onEventChange={setEvent} />
        </Col>
      </Row>
      <Row>
        <Col><h3>EXECUTE</h3>
          <ExecuteSection schedule={schedule} setSchedule={setSchedule} isNewRule={true} />
        </Col>
      </Row>
      <Row>
        <Col><h3>GO</h3>
          <GoSection ruleName={ruleName} setRuleName={setRuleName} />
        </Col>
      </Row>
      <Row>
        <div className="mt-3">
          <Button variant="primary" onClick={handleCreateOrUpdateRule}>
            {buttonText}
          </Button>
        </div>
      </Row>
    </Container>
  );
}

export default CreateRulePage;