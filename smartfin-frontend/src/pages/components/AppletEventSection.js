import React, { useCallback } from 'react';
import { Form, Dropdown, Button, Row, Col } from 'react-bootstrap';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';

/**
 * Controlled "Event" component for an Applet.
 *
 * @param {Object} props
 * @param {Object} props.eventData - The event object, shape: { type, params: { emails, phone_numbers, message } }
 * @param {Function} props.onEventChange - Callback to notify the parent of any changes
 */
function AppletEventSection({ eventData, onEventChange }) {
  // Safely destructure the event data:
  const {
    type = 'Notify Text',
    params: {
      emails = [],
      phone_numbers = [],
      message = '',
    } = {},
  } = eventData || {};

  /**
   * Because we’re controlled, every small edit calls `onEventChange(newEventObj)`.
   * The parent owns the actual state and re-passes eventData on re-render.
   */

  // 1) Handle event type changes
  const handleEventTypeChange = useCallback((selectedType) => {
    if (selectedType.includes('Coming Soon')) {
      Swal.fire({
        title: 'Coming Soon!',
        text: 'This feature is not available yet, but it’s coming soon!',
        icon: 'info',
        confirmButtonText: 'OK',
      });
      return;
    }

    onEventChange({
      type: selectedType,
      params: { emails, phone_numbers, message }
    });
  }, [onEventChange, emails, phone_numbers, message]);

  // 2) Handle adding an email
  const handleAddEmail = useCallback((newEmail) => {
    if (!newEmail.trim()) return;
    if (!/^\S+@\S+\.\S+$/.test(newEmail.trim())) return;
    onEventChange({
      type,
      params: {
        emails: [...emails, newEmail.trim()],
        phone_numbers,
        message
      },
    });
  }, [onEventChange, type, emails, phone_numbers, message]);

  // 3) Handle removing an email
  const handleRemoveEmail = useCallback((index) => {
    const updated = emails.filter((_, i) => i !== index);
    onEventChange({
      type,
      params: {
        emails: updated,
        phone_numbers,
        message
      },
    });
  }, [onEventChange, type, emails, phone_numbers, message]);

  // 4) Handle phone number add
  const handleAddPhoneNumber = useCallback((newPhone) => {
    if (!newPhone) return;
    onEventChange({
      type,
      params: {
        emails,
        phone_numbers: [...phone_numbers, newPhone],
        message
      },
    });
  }, [onEventChange, type, emails, phone_numbers, message]);

  // 5) Remove phone number
  const handleRemovePhoneNumber = useCallback((index) => {
    const updated = phone_numbers.filter((_, i) => i !== index);
    onEventChange({
      type,
      params: {
        emails,
        phone_numbers: updated,
        message
      },
    });
  }, [onEventChange, type, emails, phone_numbers, message]);

  // 6) Update message
  const handleMessageChange = useCallback((e) => {
    const newMessage = e.target.value;
    onEventChange({
      type,
      params: {
        emails,
        phone_numbers,
        message: newMessage
      },
    });
  }, [onEventChange, type, emails, phone_numbers]);

  // 7) A small helper for keyPress
  const handleEmailKeyPress = (e, newEmail) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail(newEmail);
    }
  };

  const handlePhoneKeyPress = (e, newPhone) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPhoneNumber(newPhone);
    }
  };

  // We keep ephemeral inputs in local state if you prefer,
  // but we can also do it fully controlled. For simplicity, we can do ephemeral:
  const [tempEmail, setTempEmail] = React.useState('');
  const [tempPhone, setTempPhone] = React.useState('');

  return (
    <Form>
      <Form.Group as={Row} controlId="formEventType" className="mb-3">
        <Form.Label column sm={2}>Event Type</Form.Label>
        <Col sm={10}>
          <Dropdown onSelect={handleEventTypeChange}>
            <Dropdown.Toggle variant="primary" id="dropdown-basic">
              {type || 'Select Event Type'}
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

      {/* Emails */}
      {type.includes('Email') && (
        <Form.Group as={Row} controlId="formRecipients" className="mb-3">
          <Form.Label column sm={2}>Emails</Form.Label>
          <Col sm={10}>
            {emails.map((email, index) => (
              <div key={index} className="d-flex align-items-center mb-2">
                <Form.Control type="text" readOnly value={email} />
                <Button
                  variant="danger"
                  className="ms-2"
                  onClick={() => handleRemoveEmail(index)}
                >
                  <FaTimes />
                </Button>
              </div>
            ))}
            <div className="d-flex align-items-center">
              <Form.Control
                type="text"
                placeholder="Add email"
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
                onKeyPress={(e) => handleEmailKeyPress(e, tempEmail)}
              />
              <Button
                className="ms-2"
                onClick={() => {
                  handleAddEmail(tempEmail);
                  setTempEmail('');
                }}
              >
                Add
              </Button>
            </div>
          </Col>
        </Form.Group>
      )}

      {/* Phone Numbers */}
      {type.includes('Text') && (
        <Form.Group as={Row} controlId="formPhoneNumbers" className="mb-3">
          <Form.Label column sm={2}>Phone Numbers</Form.Label>
          <Col sm={10}>
            {phone_numbers.map((phone, index) => (
              <div key={index} className="d-flex align-items-center mb-2">
                <Form.Control type="text" readOnly value={phone} />
                <Button
                  variant="danger"
                  className="ms-2"
                  onClick={() => handleRemovePhoneNumber(index)}
                >
                  <FaTimes />
                </Button>
              </div>
            ))}
            <div className="d-flex align-items-center">
              <PhoneInput
                placeholder="Add phone number"
                value={tempPhone}
                onChange={(val) => setTempPhone(val || '')}
                onKeyPress={(e) => handlePhoneKeyPress(e, tempPhone)}
              />
              <Button
                className="ms-2"
                onClick={() => {
                  handleAddPhoneNumber(tempPhone);
                  setTempPhone('');
                }}
              >
                Add
              </Button>
            </div>
          </Col>
        </Form.Group>
      )}

      {/* Message */}
      <Form.Group as={Row} controlId="formMessage" className="mb-3">
        <Form.Label column sm={2}>Message</Form.Label>
        <Col sm={10}>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Enter your message"
            value={message}
            onChange={handleMessageChange}
          />
        </Col>
      </Form.Group>
    </Form>
  );
}

export default AppletEventSection;
