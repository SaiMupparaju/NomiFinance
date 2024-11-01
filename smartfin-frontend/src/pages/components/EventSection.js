import React, { useState, useEffect, useRef} from 'react';
import { Form, Dropdown, Button, Row, Col, Card } from 'react-bootstrap';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';  // Import SweetAlert2 for alerts

function EventSection({ presetEvent, onEventChange }) {
  const initializedRef = useRef(false);
  const [eventType, setEventType] = useState(presetEvent?.type || 'Notify Text');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emails, setEmails] = useState(presetEvent?.params?.emails || []);
  const [phoneNumbers, setPhoneNumbers] = useState(presetEvent?.params?.phone_numbers || []);
  const [message, setMessage] = useState(presetEvent?.params?.message || '');

  // Update state when presetEvent changes (e.g., when editing an existing rule)
  // useEffect(() => {
  //   if (presetEvent) {
  //     setEventType(presetEvent.type || '');
  //     setEmails(presetEvent.params?.emails || []);
  //     setPhoneNumbers(presetEvent.params?.phone_numbers || []);
  //     setMessage(presetEvent.params?.message || '');
  //   }
  // }, [presetEvent]);

  useEffect(() => {
    if (presetEvent && !initializedRef.current) {
      setEventType(presetEvent.type || 'Notify Text');
      setEmails(presetEvent.params?.emails || []);
      setPhoneNumbers(presetEvent.params?.phone_numbers || []);
      setMessage(presetEvent.params?.message || '');
      initializedRef.current = true;
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

  // Handle 'Coming Soon' dropdown options
  const handleEventTypeChange = (eventKey) => {
    if (eventKey.includes('Coming Soon')) {
      Swal.fire({
        title: 'Coming Soon!',
        text: 'This feature is not available yet, but it’s coming soon!',
        icon: 'info',
        confirmButtonText: 'OK',
      });
    } else {
      setEventType(eventKey);
    }
  };

  const handleAddEmail = () => {
    if (emailInput.trim() && /^\S+@\S+\.\S+$/.test(emailInput.trim())) {
      setEmails([...emails, emailInput.trim()]);
      setEmailInput('');
    }
  };

  const handleEmailKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleAddPhoneNumber = () => {
    if (phoneInput) {
      setPhoneNumbers([...phoneNumbers, phoneInput]);
      setPhoneInput('');
    }
  };

  const handlePhoneNumberKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPhoneNumber();
    }
  };

  const handlePhoneNumberChange = (value) => {
    setPhoneInput(value);
  };

  const handleRemoveEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleRemovePhoneNumber = (index) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  return (

      <Form>
        <Form.Group as={Row} controlId="formEventType" className="mb-3">
          <Form.Label column sm={2}>Event Type</Form.Label>
          <Col sm={10}>
            <Dropdown onSelect={handleEventTypeChange}>
              <Dropdown.Toggle variant="primary" id="dropdown-basic">
                {eventType || 'Select Event Type'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey="Notify Text">Notify Text</Dropdown.Item>
                <Dropdown.Item eventKey="Notify Email">Notify Email</Dropdown.Item>
                <Dropdown.Item eventKey="Notify Text and Email">Notify Text and Email</Dropdown.Item>
                <Dropdown.Item eventKey="Coming Soon: Notify Text and Send Transaction">Notify Text and Send Transaction</Dropdown.Item>
                <Dropdown.Item eventKey="Coming Soon: Notify Email and Send Transaction">Notify Email and Send Transaction</Dropdown.Item>
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
              <div className="d-flex align-items-center">
                <Form.Control
                  type="text"
                  placeholder="Add email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={handleEmailKeyPress}
                />
                <Button className="ms-2" onClick={handleAddEmail}>
                  Add
                </Button>
              </div>
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
              <div className="d-flex align-items-center">
                <PhoneInput
                  placeholder="Add phone number"
                  value={phoneInput}
                  onChange={handlePhoneNumberChange}
                  onKeyPress={handlePhoneNumberKeyPress}
                />
                <Button className="ms-2" onClick={handleAddPhoneNumber}>
                  Add
                </Button>
              </div>
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

  );
}

export default EventSection;
