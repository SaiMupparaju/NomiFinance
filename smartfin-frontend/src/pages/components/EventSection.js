import React, { useState, useEffect } from 'react';
import { Form, Dropdown, Button, Row, Col, Card } from 'react-bootstrap';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { FaTimes } from 'react-icons/fa';

function EventSection({ presetEvent, onEventChange }) {
  const [eventType, setEventType] = useState(presetEvent?.type || 'Notify Text');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emails, setEmails] = useState(presetEvent?.params?.emails || []);
  const [phoneNumbers, setPhoneNumbers] = useState(presetEvent?.params?.phone_numbers || []);
  const [message, setMessage] = useState(presetEvent?.params?.message || '');

  // Update state when presetEvent changes (e.g., when editing an existing rule)
  useEffect(() => {
    if (presetEvent) {
      setEventType(presetEvent.type || '');
      setEmails(presetEvent.params?.emails || []);
      setPhoneNumbers(presetEvent.params?.phone_numbers || []);
      setMessage(presetEvent.params?.message || '');
    }
  }, [presetEvent]);

  useEffect(() => {
    const updatedEvent = {
      type: eventType,
      params: {
        emails,
        phone_numbers: phoneNumbers,
        message,
      },
    };

    onEventChange(updatedEvent);
    console.log('Event JSON:', JSON.stringify(updatedEvent, null, 2));
  }, [eventType, emails, phoneNumbers, message, onEventChange]);

  const handleEmailKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (emailInput.trim() && /^\S+@\S+\.\S+$/.test(emailInput.trim())) {
        setEmails([...emails, emailInput.trim()]);
        setEmailInput('');
      }
    }
  };

  const handlePhoneNumberChange = (value) => {
    if (value) {
      setPhoneInput(value);
    }
  };

  const handlePhoneNumberKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (phoneInput) {
        setPhoneNumbers([...phoneNumbers, phoneInput]);
        setPhoneInput('');
      }
    }
  };

  const handleRemoveEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleRemovePhoneNumber = (index) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-3 mb-3 bg-white border rounded">
      <h4>Event</h4>
      <Form>
        <Form.Group as={Row} controlId="formEventType" className="mb-3">
          <Form.Label column sm={2}>Event Type</Form.Label>
          <Col sm={10}>
            <Dropdown onSelect={(e) => setEventType(e)}>
              <Dropdown.Toggle variant="primary" id="dropdown-basic">
                {eventType || 'Select Event Type'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey="Notify Text">Notify Text</Dropdown.Item>
                <Dropdown.Item eventKey="Notify Email">Notify Email</Dropdown.Item>
                <Dropdown.Item eventKey="Notify Text and Email">Notify Text and Email</Dropdown.Item>
                <Dropdown.Item eventKey="Notify Text and Send Transaction">Notify Text and Send Transaction</Dropdown.Item>
                <Dropdown.Item eventKey="Notify Email and Send Transaction">Notify Email and Send Transaction</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Form.Group>

        {eventType.includes('Email') && (
          <Form.Group as={Row} controlId="formRecipients" className="mb-3">
            <Form.Label column sm={2}>Emails</Form.Label>
            <Col sm={10}>
              {emails.map((email, index) => (
                <div key={index} className="d-flex align-items-center mb-2">
                  <Form.Control type="text" readOnly value={email} />
                  <Button variant="danger" className="ms-2" onClick={() => handleRemoveEmail(index)}>
                    <FaTimes />
                  </Button>
                </div>
              ))}
              <Form.Control
                type="text"
                placeholder="Add email and press Enter"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleEmailKeyPress}
                onBlur={() => setEmailInput('')} // Clear input on blur to handle invalid emails
              />
            </Col>
          </Form.Group>
        )}

        {eventType.includes('Text') && (
          <Form.Group as={Row} controlId="formPhoneNumbers" className="mb-3">
            <Form.Label column sm={2}>Phone Numbers</Form.Label>
            <Col sm={10}>
              {phoneNumbers.map((phone, index) => (
                <div key={index} className="d-flex align-items-center mb-2">
                  <Form.Control type="text" readOnly value={phone} />
                  <Button variant="danger" className="ms-2" onClick={() => handleRemovePhoneNumber(index)}>
                    <FaTimes />
                  </Button>
                </div>
              ))}
              <PhoneInput
                placeholder="Add phone number and press Enter"
                value={phoneInput}
                onChange={handlePhoneNumberChange}
                onKeyPress={handlePhoneNumberKeyPress}
              />
            </Col>
          </Form.Group>
        )}

        <Form.Group as={Row} controlId="formMessage" className="mb-3">
          <Form.Label column sm={2}>Message</Form.Label>
          <Col sm={10}>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Col>
        </Form.Group>
      </Form>
    </Card>
  );
}

export default EventSection;
