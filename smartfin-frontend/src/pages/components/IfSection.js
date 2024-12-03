import React from 'react';
import { Row, Col, Dropdown, Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { AiOutlineExclamationCircle } from 'react-icons/ai'; 
import BankCascader from './BankCascader';

function IfSection({
  section,
  sectionIndex,
  accountProperties,
  updateCondition,
  addCondition,
  removeCondition,
  removeIfSection,
  mainOP,
  updateThisOperator,
}) {


  const operatorMapping = {
    'greaterThanInclusive': 'Greater Than or Equal To',
    'lessThanInclusive': 'Less Than or Equal To',
    'equal': 'Equals',
    'notEqual': 'Not Equal',
    'greaterThan': 'Greater Than',
    'lessThan': 'Less Than',
  };

  const operatorReverseMapping = {
    'Greater Than or Equal To': 'greaterThanInclusive',
    'Less Than or Equal To': 'lessThanInclusive',
    'Equals': 'equal',
    'Not Equal': 'notEqual',
    'Greater Than': 'greaterThan',
    'Less Than': 'lessThan',
  };

  const conditionsArray = section[section.ifOP || 'all'];


  const handleSelection = (sectionIndex, conditionIndex, attr, value) => {
    console.log('handleSelection called with:', { sectionIndex, conditionIndex, attr, value });
    updateCondition(sectionIndex, conditionIndex, attr, value?.fact);
  };

  return (
    <div className="if-section">
      {conditionsArray.length === 0 && (
        <OverlayTrigger
          placement="right"
          overlay={
            <Tooltip id={`tooltip-empty-condition-${sectionIndex}`}>
              This part has no conditions and will cause an error — press "Remove If" if you don't need it.
            </Tooltip>
          }
        >
          <span className="error-icon" style={{ color: 'red', position: 'absolute', top: 0, right: '-20px' }}>
            <AiOutlineExclamationCircle size={16} />
          </span>
        </OverlayTrigger>
      )}


      {conditionsArray.map((condition, conditionIndex) => (
        <React.Fragment key={conditionIndex}>
          <Row className="align-items-center mb-2">
            <Col md={3}>
            <BankCascader
              options={accountProperties}
              value={condition.fact}
              params={condition.params || {}}
              prop="fact"
              sectionIndex={sectionIndex}
              conditionIndex={conditionIndex}
              updateCondition={updateCondition}
            />
            </Col>

            <Col md={2}>
              <Dropdown
                onSelect={(e) =>
                  updateCondition(
                    sectionIndex,
                    conditionIndex,
                    'operator',
                    operatorReverseMapping[e]
                  )
                }
              >
                <Dropdown.Toggle variant="secondary" className="w-100">
                  {operatorMapping[condition.operator] || 'Choose Comparator'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {Object.keys(operatorMapping).map((key) => (
                    <Dropdown.Item key={key} eventKey={operatorMapping[key]}>
                      {operatorMapping[key]}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>

            <Col md={3}>
            <BankCascader
              options={accountProperties}
              value={condition.value.fact}
              params={condition.value.params || {}}
              prop="value"
              sectionIndex={sectionIndex}
              conditionIndex={conditionIndex}
              updateCondition={updateCondition}
            />
            </Col>

            {condition.value === 'Custom Value' && (
              <>
                <Col md={2}>
                  <Form.Control
                    type="number"
                    placeholder="Enter Value"
                    value={condition.customValue !== undefined ? condition.customValue : ''}
                    onChange={(e) =>
                      updateCondition(
                        sectionIndex,
                        conditionIndex,
                        'customValue',
                        parseInt(e.target.value) // Convert string to integer
                      )
                    }
                  />
                </Col>
                <Col md={2}>
                  <Dropdown
                    onSelect={(e) => updateCondition(sectionIndex, conditionIndex, 'currency', e)}
                  >
                    <Dropdown.Toggle variant="secondary" className="w-100">
                      {condition.currency || 'USD'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item eventKey="USD">USD</Dropdown.Item>
                      <Dropdown.Item eventKey="EUR">EUR</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
              </>
            )}

            <Col md={1}>
              <Button
                variant="danger"
                className="w-100"
                onClick={() => removeCondition(sectionIndex, conditionIndex)}
              >
                x
              </Button>
            </Col>
          </Row>

          {/* Insert the AND/OR operator dropdown between conditions */}
          {conditionIndex < conditionsArray.length - 1 && (
            <Row className="align-items-center mb-2">
              <Col md={{ span: 2, offset: 2 }}>
                <Dropdown onSelect={(e) => updateThisOperator(sectionIndex, e)}>
                  <Dropdown.Toggle variant="info" className="w-100">
                    {section.ifOP === 'all' ? 'AND' : 'OR'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="AND">AND</Dropdown.Item>
                    <Dropdown.Item eventKey="OR">OR</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          )}
        </React.Fragment>
      ))}
      <Button variant="outline-primary" onClick={() => addCondition(sectionIndex)}>
        Add Condition
      </Button>
      <Button
        variant="outline-danger"
        className="ms-2"
        onClick={() => removeIfSection(sectionIndex)}
      >
        Remove If
      </Button>
    </div>
  );
}

export default IfSection;
