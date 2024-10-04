import React, { useState, useEffect} from 'react';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as necessary
import { useFact } from '../contexts/FactContext';
import { Container, Row, Col } from 'react-bootstrap';
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

function EditRulePage() {
  const { auth } = useAuth();
  const { factTree, userFacts } = useFact();
  const { ruleId } = useParams(); // Get rule ID from URL if present
  const navigate = useNavigate();
  const location = useLocation();

  const [executionTime, setExecutionTime] = useState('immediately');
  const [ruleName, setRuleName] = useState('');
  const [conditions, setConditions] = useState([]);
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
        //console.log("edit rule PAGE sched:", schedule);
        setButtonText("Save Rule");
      };
      fetchRuleData();
    } 
  }, []);

  const handleCreateOrUpdateRule = async () => {
    const rule = {
      name: ruleName,
      conditions: { all: conditions },
      event: event,
      schedule: schedule,
    };
    console.log("updating rule...", ruleId);
    try {
      if (ruleId) {
        // Update existing rule
        await updateRule(ruleId, {
          creatorId: auth.user.id,
          subscriberId: auth.user.id,
          rule: rule,
        });
      } else {
        // Create new rule
        await createRule({
          creatorId: auth.user.id,
          subscriberId: auth.user.id,
          rule: rule,
        });
      }
      navigate('/home'); // Navigate back after operation
    } catch (error) {
      console.error('Failed to create/update rule:', error.message);
    }
  };

  return (
    <Container className="create-rule-container">
      <Row>
        <Col><h3>IF</h3>
          <EditMainIfSection onConditionsChange={setConditions} conditions={conditions} accountProperties={factTree}/>
        </Col>
      </Row>
      <Row>
        <Col><h3>THEN</h3>
          <EventSection presetEvent={event} onEventChange={setEvent} />
        </Col>
      </Row>
      <Row>
        <Col><h3>EXECUTE</h3>
          <ExecuteSection schedule={schedule} setSchedule={setSchedule} />
        </Col>
      </Row>
      <Row>
        <Col><h3>GO</h3>
          <GoSection ruleName={ruleName} setRuleName={setRuleName} />
        </Col>
      </Row>
      <Row>
        <div className="mt-3"> {/* Added margin to create space between the input and button */}
          <Button variant="primary" onClick={handleCreateOrUpdateRule}>
            {buttonText}
          </Button>
        </div>
      </Row>
    </Container>
  );
}

export default EditRulePage;