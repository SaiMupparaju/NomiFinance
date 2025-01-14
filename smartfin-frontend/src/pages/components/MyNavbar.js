 // MyNavbar.js
import React from 'react';
import { Navbar, Nav, NavDropdown, Button, Container } from 'react-bootstrap';
import { FaCog, FaThLarge, FaTh, FaBars, FaSignOutAlt, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

/**
 * Props you might want to pass:
 *  - hasBankAccounts (boolean)
 *  - handleCreateRule (function)
 *  - handleLayoutChange (function)
 *  - setShowSettingsModal (function) to open settings
 *  - authUser (object) to check if the user is logged in
 *  - handleLogout (function)
 *  - subscriptionStatus (string) e.g., 'active' or not
 *  - handlePayment (function) if you want to show Subscribe button
 *  - TestControls (optional) for dev environment
 */
function MyNavbar({
  hasBankAccounts,
  handleCreateRule,
  handleLayoutChange,
  setShowSettingsModal,
  authUser,
  handleLogout,
  subscriptionStatus,
  handlePayment,
  TestControls,
}) {
  const navigate = useNavigate();

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="w-100 mb-4">
      <Container fluid className="px-4">
        {/* If you have dev controls and you only want them in development */}
        {process.env.REACT_APP_ENV === 'development' && TestControls && <TestControls />}

        {/* Logo text in bold + [Beta] */}
        <Navbar.Brand className="text-white me-auto">
          <strong>Nomi Finance</strong>
          <sup style={{ fontSize: '0.7rem', color: 'lightgreen', marginLeft: '4px' }}>
            [Beta]
          </sup>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* Conditionally show "Connect Accounts" or "Create Rule" 
                ONLY if hasBankAccounts is explicitly provided (not undefined) */}
            {typeof hasBankAccounts !== 'undefined' && (
              !hasBankAccounts ? (
                <Button
                  onClick={() => navigate('/connect-banks')}
                  variant="primary"
                  className="me-2"
                >
                  <FaPlus /> Connect Accounts
                </Button>
              ) : (
                // Show "Create Rule" only if handleCreateRule is provided
                handleCreateRule && (
                  <Button
                    variant="primary"
                    onClick={handleCreateRule}
                    className="me-2"
                  >
                    <FaPlus /> Create Rule
                  </Button>
                )
              )
            )}

            {/* Layout Selector Dropdown only if we have handleLayoutChange */}
            {typeof handleLayoutChange === 'function' && (
              <NavDropdown align="end" title={<FaThLarge />} id="layout-dropdown">
                <NavDropdown.Item onClick={() => handleLayoutChange('small')}>
                  <FaTh /> Small Layout
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => handleLayoutChange('medium')}>
                  <FaThLarge /> Medium Layout
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => handleLayoutChange('large')}>
                  <FaBars /> Large Layout
                </NavDropdown.Item>
              </NavDropdown>
            )}

            {/* Settings Icon only if setShowSettingsModal is provided */}
            {typeof setShowSettingsModal === 'function' && (
              <Nav.Link onClick={() => setShowSettingsModal(true)}>
                <FaCog className="text-white" />
              </Nav.Link>
            )}

            {/* Show "Subscribe" only if user is logged in, sub not active, and handlePayment is provided */}
            {authUser && subscriptionStatus !== 'active' && typeof handlePayment === 'function' && (
              <Button variant="success" onClick={handlePayment} className="me-2">
                Subscribe Now
              </Button>
            )}

            {/* If user is logged in and handleLogout is defined, show Logout; otherwise show Sign Up */}
            {authUser && typeof handleLogout === 'function' ? (
              <Button
                variant="danger"
                onClick={handleLogout}
                className="ms-2"
              >
                <FaSignOutAlt /> Logout
              </Button>
            ) : (
              !authUser && (
                <Button
                  variant="success"
                  onClick={() => navigate('/register')}
                  className="ms-2"
                >
                  Sign Up
                </Button>
              )
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default MyNavbar;
