import React, { useState, useEffect} from 'react';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as necessary
import { useFact } from '../contexts/FactContext';
import { Container, Row, Col, Alert, Accordion } from 'react-bootstrap';
import MainIfSection from './components/MainIfSection';
import EditMainIfSection from './components/editMainIfsection';
import ExecuteSection from './components/ExecuteSection';
import GoSection from './components/GoSection';
import EventSection from './components/EventSection';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/CreateRulePage.css';
import { createRule, getRuleById, updateRule } from '../utils/rule_api'; // Import the createRule function
import {Button} from 'react-bootstrap';
import Swal from 'sweetalert2';


function EditRulePage() {
  const { auth } = useAuth();
  const { factTree, userFacts } = useFact();
  const { ruleId } = useParams(); // Get rule ID from URL if present
  const navigate = useNavigate();
  const location = useLocation();
  const userRules = location.state?.userRules || [];

  const [executionTime, setExecutionTime] = useState('immediately');
  const [ruleName, setRuleName] = useState('');
  const [conditions, setConditions] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [color, setColor] = useState('#000000');
  const [event, setEvent] = useState(null);
  const [schedule, setSchedule] = useState({
    events: [],
    view: 'timeGridWeek',
  });
  const [buttonText, setButtonText] = useState("Create Rule");

  useEffect(() => {
    // Example of preset values for the event state
    const presetEvent = {
      type: 'Notify Text',
      params: {
        recipients: ['1234567890'],
        message: '...',
      },
    };
    setEvent(presetEvent);
  }, []);

  useEffect(() => {
    if (location.state?.cond) {
      const fetchRuleData = async () => {
        console.log("/edit-rule PAGE", location.state?.cond);
        // Check if rule data is passed via state
        const ruleData = location.state.cond;
        setRuleName(ruleData.name);
        setConditions(ruleData.conditions.all); //sets conditions to the value that mainif works with this is the if statements separated by operator
        setEvent(ruleData.event);
        setSchedule({ ...schedule, ...ruleData.schedule });
        setColor(ruleData.color);
        //console.log("edit rule PAGE sched:", schedule);
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

        if ((condition.fact.includes('income')&&condition.fact.includes('from')) && (!condition.params || !condition.params.incomes || condition.params.incomes.length === 0)) {
          return { isValid: false, message: 'When you want the rule to calculate your incomes from specific sources, you must specify from where!' };
        }

        if ((condition.value.fact.includes('income')&&condition.value.fact.includes('from')) && (!condition.value.params || !condition.value.params.incomes || condition.value.params.incomes.length === 0)) {
          return { isValid: false, message: 'When you want the rule to calculate your incomes from specific sources, you must specify from where!' };
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
  
      if (subscriptionProductId === process.env.REACT_APP_NOMI_PREMIUM) {
        limit = Infinity; // Premium has no limit
      } else if (subscriptionProductId === process.env.REACT_APP_NOMI_STANDARD) {
        limit = 4; // Standard subscription limit
      } else if (subscriptionProductId === process.env.REACT_APP_NOMI_SINGLE) {
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
      console.error('Failed to create/update rule:', error.message);
      Swal.fire({
        title: 'Error Creating Rule',
        text: 'There was an issue creating your rule. Please try again later.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };


  return (
    // <Container className="create-rule-container">
    //   <Row>
    //     <Col><h3>IF</h3>
    //       <EditMainIfSection onConditionsChange={setConditions} conditions={conditions} accountProperties={factTree}/>
    //     </Col>
    //   </Row>
    //   <Row>
    //     <Col><h3>THEN</h3>
    //       <EventSection presetEvent={event} onEventChange={setEvent} />
    //     </Col>
    //   </Row>
    //   <Row>
    //     <Col><h3>EXECUTE</h3>
    //       <ExecuteSection schedule={schedule} setSchedule={setSchedule} />
    //     </Col>
    //   </Row>
    //   <Row>
    //     <Col><h3>GO</h3>
    //       <GoSection ruleName={ruleName} setRuleName={setRuleName} />
    //     </Col>
    //   </Row>
    //   <Row>
    //     <div className="mt-3"> {/* Added margin to create space between the input and button */}
    //       <Button variant="primary" onClick={handleCreateOrUpdateRule}>
    //         {buttonText}
    //       </Button>
    //     </div>
    //   </Row>
    // </Container>


  <Container className="create-rule-container">
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Accordion defaultActiveKey={[]} alwaysOpen>
        <Accordion.Item eventKey="0" className="iff-section">
          <Accordion.Header>IF</Accordion.Header>
          <Accordion.Body>
            <EditMainIfSection onConditionsChange={setConditions} conditions={conditions} accountProperties={factTree}/>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="1" className="then-section">
          <Accordion.Header>THEN</Accordion.Header>
          <Accordion.Body>
            <EventSection presetEvent={event} onEventChange={setEvent} />
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="2" className="execute-section">
          <Accordion.Header>EXECUTE</Accordion.Header>
          <Accordion.Body>
          <ExecuteSection schedule={schedule} setSchedule={setSchedule} />
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="3" className="name-section">
          <Accordion.Header>NAME</Accordion.Header>
          <Accordion.Body>
          <GoSection ruleName={ruleName} setRuleName={setRuleName} />
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
      <div className="mt-3">
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      </div>
      <div className="mt-3 text-end">
        <Button variant="primary" onClick={handleCreateOrUpdateRule}>
          {buttonText}
        </Button>
      </div>
    </Container>
  );
}

export default EditRulePage;