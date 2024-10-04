import React, { useEffect } from 'react';
import { Form, Button, Col, Card } from 'react-bootstrap';

function GoSection({ ruleName, setRuleName, handleCreateRule }) {
  useEffect(() => {
    const ruleJson = {
      name: ruleName,
    };

    console.log('Go Section JSON:', JSON.stringify(ruleJson, null, 2));
  }, [ruleName]);

  return (
    <Card className="p-3 mb-3 bg-white border rounded">
      <Form.Group controlId="ruleName">
        <Col>
          <Form.Label>Now name this rule</Form.Label>
          <Form.Control
            type="text"
            placeholder="Eg. Got Paid!"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
          />
        </Col>
      </Form.Group>

    </Card>
  );
}

export default GoSection;
