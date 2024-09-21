import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFact } from '../contexts/FactContext'; 
import { useNavigate } from 'react-router-dom';
import { fetchBankAccounts } from '../utils/plaid_api';
import { getUserRules } from '../utils/rule_api'; 
import RuleCard from './components/RuleCard';
import SettingsModal from './components/SettingsModal';
import { Navbar, Nav, NavDropdown, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { FaCog, FaThLarge, FaTh, FaBars, FaSignOutAlt, FaPlus } from 'react-icons/fa';
import './styles/Home.css';

function Home() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  
  const [bankAccounts, setBankAccounts] = useState([]);
  const [rules, setRules] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [layoutOption, setLayoutOption] = useState('small'); // Default to small layout
  const [banksNeedUpdate, setBanksNeedUpdate] = useState(false); // To track if any bank needs update

  useEffect(() => {
    // Retrieve saved layout preference
    const savedLayout = localStorage.getItem('layoutOption');
    if (savedLayout) {
      setLayoutOption(savedLayout);
    }

    const getBankAccountsAndRules = async () => {
      if (auth.user) {
        try {
          const accounts = await fetchBankAccounts();
          setBankAccounts(accounts);

          const userRules = await getUserRules(auth.user.id);
          setRules(userRules);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };
    getBankAccountsAndRules();
  }, [auth]);

  //once bank accounts are loaded see if any of them need updating
  useEffect(() => {
    if (auth.user && Array.isArray(bankAccounts)) {
      const anyBankNeedsUpdate = bankAccounts.length > 0 && bankAccounts.some(bank =>
        Array.isArray(bank) && bank.some(account => account.needsUpdate)
      );
      setBanksNeedUpdate(anyBankNeedsUpdate);
      console.log("Does a Bank need updating?", anyBankNeedsUpdate);
    }
  }, [bankAccounts, auth.user]);

  useEffect(() => {
    if (banksNeedUpdate) {
      alert('Some of your bank accounts need to be updated.');
      setShowSettingsModal(true); // Automatically show modal if any bank needs update
    }
  }, [banksNeedUpdate]);

  useEffect(() => {
    console.log("/home fetched accounts:", bankAccounts);
  }, [bankAccounts]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleCreateRule = () => {
    navigate('/create-rule');
  };

  const handleToggleRule = (ruleId, isActive) => {
    setRules(prevRules =>
      prevRules.map(rule =>
        rule._id === ruleId ? { ...rule, isActive } : rule
      )
    );
  };

  const handleLayoutChange = (option) => {
    setLayoutOption(option);
    localStorage.setItem('layoutOption', option); // Save user preference
  };

  // Adjusted getColSize function to control the number of columns per row
  const getColSize = (layoutOption) => {
    switch(layoutOption) {
      case 'small':
        return { xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }; // More columns per row
      case 'medium':
        return { xs: 12, sm: 6, md: 6, lg: 4, xl: 3 };
      case 'large':
        return { xs: 12, sm: 12, md: 12, lg: 6, xl: 4 }; // Fewer columns per row
      default:
        return { xs: 12, sm: 6, md: 4, lg: 3, xl: 2 };
    }
  };

  return (
    <Container fluid className="home-container">
      {/* Navigation Bar */}
      <Navbar bg="light" expand="lg" className="w-100 mb-4">
        <Container fluid>
          <Navbar.Brand>Welcome, {auth.user ? auth.user.name : 'Guest'}!</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              {/* Create Rule Button */}
              <Button variant="outline-primary" onClick={handleCreateRule} className="me-2">
                <FaPlus /> Create Rule
              </Button>

              {/* Layout Selector Dropdown */}
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

              {/* Settings Icon */}
              <Nav.Link onClick={() => setShowSettingsModal(true)}>
                <FaCog />
              </Nav.Link>

              {/* Logout Button */}
              <Button variant="outline-danger" onClick={handleLogout} className="ms-2">
                <FaSignOutAlt /> Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Rule Cards */}
      <Container fluid>
        <Row className="justify-content-center">
          {rules.map((rule, index) => {
            const colSize = getColSize(layoutOption);
            return (
              <Col key={index} {...colSize} className="mb-4 d-flex">
                <RuleCard key={rule._id || index} rule={rule} onToggle={handleToggleRule} />
              </Col>
            );
          })}
        </Row>
      </Container>

      <SettingsModal 
      bankAccounts = {bankAccounts}
      show={showSettingsModal} 
      handleClose={() => setShowSettingsModal(false)} />
    </Container>
  );
}

export default Home;
