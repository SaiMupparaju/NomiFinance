// src/components/SettingsModal.js

import React from 'react';
import { Modal, Tab, Nav, Row, Col, Button } from 'react-bootstrap';

// Import individual components for each tab
import UpdateAccounts from './settings/UpdateAccounts';
import ProfileSettings from './settings/ProfileSettings';
import PaymentInfo from './settings/PaymentInfo';

function SettingsModal({ show, handleClose, bankAccounts }) {
  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <div className="container-fluid p-4">
        <h4 className="font-weight-bold py-3 mb-4">Account Settings</h4>

        <Tab.Container defaultActiveKey="update-accounts">
          <Row className="no-gutters">
            <Col md={3} className="pr-3">
              <Nav variant="pills" className="flex-column account-settings-links">
                <Nav.Item>
                  <Nav.Link eventKey="update-accounts">Bank Accounts</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="profile-settings">Profile Settings</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="payment-info">Payment Info</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="privacy-policy">Privacy Policy</Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
            <Col md={9}>
              <Tab.Content>
                <Tab.Pane eventKey="update-accounts">
                  <div className="p-3">
                    <UpdateAccounts bankAccounts={bankAccounts} />
                  </div>
                </Tab.Pane>
                <Tab.Pane eventKey="profile-settings">
                  <div className="p-3">
                    <ProfileSettings />
                  </div>
                </Tab.Pane>
                <Tab.Pane eventKey="payment-info">
                  <div className="p-3">
                    <PaymentInfo />
                  </div>
                </Tab.Pane>
                <Tab.Pane eventKey="privacy-policy">
                  <div className="p-3">
                    <h5>Privacy Policy</h5>
                    <iframe
                      src="/privacypolicy.pdf"
                      style={{ width: '100%', height: '500px', border: 'none' }}
                      title="Privacy Policy"
                    ></iframe>
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>

        <div className="text-right mt-4">
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SettingsModal;
