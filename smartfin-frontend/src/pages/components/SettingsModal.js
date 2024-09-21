import React from 'react';
import { Modal, Tab, Nav, Row, Col, Button } from 'react-bootstrap';

// Import individual components for each tab
import UpdateAccounts from './settings/UpdateAccounts';
import ProfileSettings from './settings/ProfileSettings';
import PhoneContacts from './settings/PhoneContacts';
import PaymentInfo from './settings/PaymentInfo';

function SettingsModal({ show, handleClose, bankAccounts }) {
    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <div className="container light-style flex-grow-1 container-p-y">
                <h4 className="font-weight-bold py-3 mb-4">Account settings</h4>

                <Tab.Container defaultActiveKey="update-accounts">
                    <Row className="no-gutters row-bordered row-border-light">
                        <Col md={3} className="pt-0">
                            <Nav variant="pills" className="flex-column account-settings-links">
                                <Nav.Item>
                                    <Nav.Link eventKey="update-accounts">Update Accounts</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="profile-settings">Profile Settings</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="phone-contacts">Phone Contacts</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="payment-info">Payment Info</Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Col>
                        <Col md={9}>
                            <Tab.Content className="tab-content">
                                <Tab.Pane eventKey="update-accounts">
                                    <UpdateAccounts bankAccounts={bankAccounts} />
                                </Tab.Pane>
                                <Tab.Pane eventKey="profile-settings">
                                    <ProfileSettings />
                                </Tab.Pane>
                                <Tab.Pane eventKey="phone-contacts">
                                    <PhoneContacts />
                                </Tab.Pane>
                                <Tab.Pane eventKey="payment-info">
                                    <PaymentInfo />
                                </Tab.Pane>
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>

                <div className="text-right mt-3">
                    <Button variant="primary" onClick={handleClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
}

export default SettingsModal;
