import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFact } from '../contexts/FactContext'; 
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '../contexts/AccountsContext'; // Use the new Accounts Context
import { getUserRules } from '../utils/rule_api'; 
import RuleCard from './components/RuleCard';
import SettingsModal from './components/SettingsModal';
import { Navbar, Nav, NavDropdown, Button, Container, Row, Col } from 'react-bootstrap';
import { FaCog, FaThLarge, FaTh, FaBars, FaSignOutAlt, FaPlus } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import './styles/Home.css';

function Home() {
  const { auth, logout } = useAuth();
  const { accounts: bankAccounts, refreshAccounts, loading, error } = useAccounts(); // Access bank accounts from context
  const navigate = useNavigate();
  const { factTree, refetchFactTree } = useFact();
  
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

    const getRules = async () => {
      if (auth.user) {
        try {
          const userRules = await getUserRules(auth.user.id);
          setRules(userRules);
        } catch (error) {
          console.error('Error fetching rules:', error);
        }
      }
    };

    getRules();
  }, [auth]);

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
    console.log("HOME fact tree", factTree);
    console.log("HOME bank accounts", bankAccounts);
  }, [factTree, bankAccounts])

  useEffect(() => {
    if (banksNeedUpdate) {
      alert('Some of your bank accounts need to be updated.');
      setShowSettingsModal(true); // Automatically show modal if any bank needs update
    }
  }, [banksNeedUpdate]);

  useEffect(() => {
    if (auth.user && factTree[0].label === 'Guest Bank') {
      console.log('Fact tree is still the default guest tree, fetching the user-specific fact tree...');
      refetchFactTree(); // Call the method to fetch the user's fact tree
    }
  }, [auth, factTree, refetchFactTree]);

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

  const getColSize = (layoutOption) => {
    switch(layoutOption) {
      case 'small':
        return { xs: 12, sm: 6, md: 3 }; // 4 columns per row at md breakpoint
      case 'medium':
        return { xs: 12, sm: 6, md: 6 }; // 2 columns per row at md breakpoint
      case 'large':
        return { xs: 12, sm: 12, md: 12 }; // 1 column per row
      default:
        return { xs: 12, sm: 6, md: 3 };
    }
  };

  const stripePromise = useMemo(() => loadStripe("pk_test_51Q74V1FbGvhl0lO07hE1gQ7N8T2ejNIphVf2BsJcmYLm15IfJDfRQ7SBsEG6LAWkScHD3NtzK8scMacLLn9V6lEV00qBGkCE6n"), []);

  // Function to initiate the payment
  const handlePayment = () => {
    navigate('/pricing'); // Replace '/pricing' with the actual route to your Pricing Table
  };

  return (
    <>
      {/* Navigation Bar Outside the Container */}
      <Navbar bg="dark" variant="dark" expand="lg" className="w-100 mb-4">
        <Container fluid className="px-4"> {/* Adds padding on the left and right */}
          <Navbar.Brand className="text-white">Nomi.fyi</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Button variant="primary" onClick={handleCreateRule} className="me-2">
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
                <FaCog className="text-white" />
              </Nav.Link>

              {auth.user && auth.user.subscriptionStatus !== 'active' && (
                <Button variant="success" onClick={handlePayment} className="me-2">
                  Subscribe Now
                 </Button>
              )}

              {/* Conditionally render Logout or Sign Up button */}
              {!auth.user ? (
                <Button variant="success" onClick={() => navigate('/register')} className="ms-2">
                  Sign Up
                </Button>
              ) : (
                <Button variant="danger" onClick={handleLogout} className="ms-2">
                  <FaSignOutAlt /> Logout
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <div className="home-container">
        <Container fluid>
          {rules.length === 0 ? (
            <div className="text-center my-5">
              <h1 style={{ fontSize: '4rem' }}>😕</h1>
              <h3 className="mb-4">So empty... Why not create a new rule?</h3>
              <Button onClick={handleCreateRule} size="lg" variant="primary">
                Create a Rule
              </Button>
            </div>
          ) : (
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
          )}
        </Container>

        <SettingsModal 
          bankAccounts={bankAccounts}
          show={showSettingsModal} 
          handleClose={() => setShowSettingsModal(false)} 
          refreshAccounts={refreshAccounts}  
          loading={loading}                
          error={error}                     
        />
      </div>
    </>
  );
}



export default Home;
