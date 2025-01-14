// src/pages/components/AppletForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Card, Container, Accordion, Alert } from 'react-bootstrap';
import { useAccounts } from '../../contexts/AccountsContext';
import { useAuth } from '../../contexts/AuthContext';
import { createRule, updateRule } from '../../utils/rule_api';
import Swal from 'sweetalert2';
import { factTreeService } from '../../utils/factTreeService';
import { useFact } from '../../contexts/FactContext';

import { appletConfigs } from './AppletConfigs';
import ExecuteSection from './ExecuteSection';  
import AppletEventSection from './AppletEventSection';

/** Validate the final rule before sending */
function validateRule(rule) {
  // Basic name check
  if (!rule.name || rule.name.trim() === '') {
    return 'Please provide a rule name.';
  }

  // Basic condition check
  const conditions = rule.conditions?.all?.conditions?.all;
  if (!conditions || conditions.length === 0) {
    return 'No conditions specified.';
  }

  // Basic event check: must have at least an email or phone
  if (!rule.event || !rule.event.params) {
    return 'You must specify a valid event.';
  }
  const { emails = [], phone_numbers = [], message = '' } = rule.event.params;
  if (emails.length === 0 && phone_numbers.length === 0) {
    return 'You must specify at least one recipient (phone number or email).';
  }
  if (!message || message.trim() === '') {
    return 'Your message must be non-empty.';
  }

  return null;  // means "no errors"
}

function AppletForm() {
  const navigate = useNavigate();
  const location = useLocation();

  // If we came from "editing" an existing rule, cond includes rule data
  const { cond } = location.state || {};
  const isEditing = !!cond;

  // ID of the applet config
  const appletId = cond?.appletId || location.state?.appletId;
  const appletConfig = appletConfigs[appletId];

  const { auth } = useAuth();
  const { factTree } = useFact();
  const { accounts: bankAccounts } = useAccounts();

  // 1) formValues -> placeholders for the rule's conditions
  const [formValues, setFormValues] = useState(
    isEditing ? (cond.appletInputs || {}) : {}
  );

  // 2) schedule -> if hideExecuteSection is false, the user can override it
  const [schedule, setSchedule] = useState(() => {
    if (isEditing && cond.rule?.schedule) {
      return { ...cond.rule.schedule };
    }
    // else fallback to config's schedule if it exists
    return { ...appletConfig?.ruleConfig?.schedule };
  });

  // 3) event -> if editing, use the old rule’s event. Otherwise, start empty
  //    (i.e., never fill from the applet config).
  const [event, setEvent] = useState(() => {
    if (isEditing && cond.rule?.event) {
      return cond.rule.event;
    }
    // ALWAYS start out empty if new
    return {
      type: 'Notify Text',
      params: {
        emails: [],
        phone_numbers: [],
        message: ''
      }
    };
  });

  // 4) Name -> If editing, use the old name. Otherwise, fallback to config or "Untitled"
  const [ruleName, setRuleName] = useState(() => {
    if (isEditing && cond.rule?.name) {
      return cond.rule.name;
    }
    return appletConfig?.ruleConfig?.name || 'Untitled Applet';
  });

  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * If you prefer to do more advanced merging logic, you could do it in
   * useEffect, but for this example, we handle it inline in the initial states.
   */
  useEffect(() => {
    if (cond && isEditing) {
      // In case you want additional merges or checks
      // (But we already set the states in the initializers)
    }
  }, [cond, isEditing]);

  if (!appletConfig) {
    return (
      <Container className="py-4">
        <Card>
          <Card.Body>
            <h2>Invalid Configuration</h2>
            <p>No applet configuration found.</p>
            <Button variant="primary" onClick={() => navigate('/home')}>
              Return Home
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Convert factTree to account selection options
  const bankAccountOptions = factTreeService.getBankAccountOptions(factTree);

  /**
   * buildFinalRule:
   *  - We run appletConfig.generateRule(formValues) to produce the base conditions & default schedule
   *  - If hideExecuteSection is false, overlay the schedule from state
   *  - ALWAYS override the event with `event` from state
   *  - set the name to user’s input or fallback
   */
  const buildFinalRule = () => {
    // 1) Generate base rule from config placeholders
    const baseRule = appletConfig.generateRule(formValues);

    // 2) If hideExecuteSection is false, let user’s chosen schedule override
    //    otherwise, keep the config’s schedule from baseRule
    if (!appletConfig.hideExecuteSection) {
      baseRule.schedule = { ...schedule };
    }

    // 3) Always override with current event state
    baseRule.event = { ...event };

    // 4) Set name
    if (!baseRule.name) {
      baseRule.name = ruleName;
    } else {
      baseRule.name = ruleName;
    }
    return baseRule;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.user) {
      Swal.fire(
        'Login Required',
        'You must be logged in to create a rule.',
        'warning'
      );
      return;
    }

    const finalRule = buildFinalRule();

    // Validate
    const error = validateRule(finalRule);
    if (error) {
      setErrorMessage(error);
      return;
    }

    try {
      const ruleData = {
        creatorId: auth.user.id,
        subscriberId: auth.user.id,
        rule: finalRule,
        isActive: true,
        isApplet: true,
        appletId,
        appletInputs: formValues,
      };

      if (isEditing && cond._id) {
        await updateRule(cond._id, ruleData);
        Swal.fire('Success!', 'Rule updated successfully', 'success');
      } else {
        await createRule(ruleData);
        Swal.fire('Success!', 'Rule created successfully', 'success');
      }
      navigate('/home');
    } catch (ex) {
      console.error('Error saving rule:', ex);
      Swal.fire('Error', `Failed to ${isEditing ? 'update' : 'create'} rule`, 'error');
    }
  };

  const handleGetRuleJSON = () => {
    const finalRule = buildFinalRule();
    console.log('Final rule JSON:', finalRule);
    Swal.fire({
      title: 'Rule JSON',
      html: `<pre style="text-align:left">${JSON.stringify(finalRule, null, 2)}</pre>`,
      width: 600,
      confirmButtonText: 'Close'
    });
  };

  // Progressive reveal for inputs
  const shouldShowInput = (inputIndex) => {
    if (inputIndex === 0) return true;
    for (let i = 0; i < inputIndex; i++) {
      const prevKey = appletConfig.inputs[i].key;
      const value = formValues[prevKey];
      if (!value && value !== 0) return false;
    }
    return true;
  };

  const renderInput = (input, index) => {
    if (!shouldShowInput(index)) return null;

    switch (input.type) {
      case 'accountSelect':
        return (
          <Form.Group className="mb-3" key={input.key}>
            <Form.Label>{input.label}</Form.Label>
            <Form.Select
              value={formValues[input.key] || ''}
              onChange={(e) =>
                setFormValues({
                  ...formValues,
                  [input.key]: e.target.value
                })
              }
              required={input.required}
            >
              <option value="">Select an account</option>
              {bankAccountOptions.map((bank) => (
                <optgroup key={bank.value} label={bank.label}>
                  {bank.accounts.map((account) => (
                    <option key={account.value} value={account.fullPath}>
                      {account.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Form.Select>
          </Form.Group>
        );

      case 'number':
        return (
          <Form.Group className="mb-3" key={input.key}>
            <Form.Label>{input.label}</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter an amount (0 or more)"
              min="0"
              value={formValues[input.key] ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormValues({
                  ...formValues,
                  [input.key]: val === '' ? '' : parseFloat(val)
                });
              }}
              required={input.required}
            />
          </Form.Group>
        );

      case 'select':
        return (
          <Form.Group className="mb-3" key={input.key}>
            <Form.Label>{input.label}</Form.Label>
            <Form.Select
              value={formValues[input.key] || ''}
              onChange={(e) =>
                setFormValues({
                  ...formValues,
                  [input.key]: e.target.value
                })
              }
              required={input.required}
            >
              <option value="">Select an option</option>
              {input.options && input.options.map((opt) => {
                if (typeof opt === 'object') {
                  return (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  );
                }
                return (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                );
              })}
            </Form.Select>
          </Form.Group>
        );

      default:
        // e.g. phone, text, email
        return (
          <Form.Group className="mb-3" key={input.key}>
            <Form.Label>{input.label}</Form.Label>
            <Form.Control
              type="text"
              placeholder={input.placeholder || ''}
              value={formValues[input.key] || ''}
              onChange={(e) =>
                setFormValues({
                  ...formValues,
                  [input.key]: e.target.value
                })
              }
              required={input.required}
            />
          </Form.Group>
        );
    }
  };

  const allInputsFilled = appletConfig.inputs.every((inp) => {
    const val = formValues[inp.key];
    return val !== '' && val !== undefined;
  });

  return (
    <Container className="py-4">
      <Card>
        <Card.Body>
          <div className="d-flex align-items-center mb-4">
            <span className="h3 me-2">{appletConfig.icon}</span>
            <h2 className="mb-0">{appletConfig.title}</h2>
            {/* optional: you can show appletConfig.description below the title */}
          </div>

          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

          <Form onSubmit={handleSubmit}>
            {appletConfig.inputs.map((input, idx) => renderInput(input, idx))}

            {allInputsFilled && (
              <Accordion className="mb-4">

                {/* If hideExecuteSection === true, do not show the scheduling panel */}
                {!appletConfig.hideExecuteSection && (
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      How often should this rule execute?
                    </Accordion.Header>
                    <Accordion.Body>
                      <ExecuteSection
                        schedule={schedule}
                        setSchedule={setSchedule}
                        isNewRule={!isEditing}
                      />
                    </Accordion.Body>
                  </Accordion.Item>
                )}

                <Accordion.Item eventKey="1">
                  <Accordion.Header>
                    How would you like to be notified?
                  </Accordion.Header>
                  <Accordion.Body>
                    <AppletEventSection
                      eventData={event}
                      onEventChange={setEvent}
                    />
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            )}

            <div className="d-flex justify-content-between mt-4">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/home')}
              >
                Cancel
              </Button>

              {allInputsFilled && (
                <div className="d-flex">
                  {/* <Button 
                    variant="info" 
                    className="me-2"
                    onClick={handleGetRuleJSON}
                  >
                    Get Rule JSON
                  </Button> */}
                  <Button type="submit" variant="primary">
                    {isEditing ? 'Update Rule' : 'Create Rule'}
                  </Button>
                </div>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AppletForm;
