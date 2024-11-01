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
import Swal from "sweetalert2";
import axiosInstance from '../utils/axiosInstance';
import './styles/Home.css';

function Home() {
  const { auth, logout } = useAuth();
  const { accounts: bankAccounts, refreshAccounts, loading, error } = useAccounts(); // Access bank accounts from context
  const navigate = useNavigate();
  const { factTree, refetchFactTree } = useFact();
  
  const [rules, setRules] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [layoutOption, setLayoutOption] = useState('large'); // Default to small layout
  const [banksNeedUpdate, setBanksNeedUpdate] = useState(false); // To track if any bank needs update


  const [subscriptionLimit, setSubscriptionLimit] = useState(0);
  const [activeRulesCount, setActiveRulesCount] = useState(0);

  useEffect(() => {
    if (auth.user) {
      const subscriptionProductId = auth.user.subscriptionProductId;

      let limit = 0;
      if (subscriptionProductId === 'prod_R0b23M9NcTgjfF') {
        limit = Infinity; // Premium has no limit
      } else if (subscriptionProductId === 'prod_R22J6iyXBxcFLX') {
        limit = 4; // Standard subscription limit
      } else if (subscriptionProductId === 'prod_R0auXMo4nOGFkM') {
        limit = 1; // Single subscription limit
      } else {
        limit = 0; // No subscription
      }

      setSubscriptionLimit(limit);
      setActiveRulesCount(rules.filter((rule) => rule.isActive).length);
    }
  }, [auth.user, rules]);

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
    navigate('/create-rule', { state: { userRules: rules } });
  };

  const handleToggleRule = (ruleId, isActive) => {
    setRules(prevRules =>
      prevRules.map(rule =>
        rule._id === ruleId ? { ...rule, isActive } : rule
      )
    );
  };

  useEffect(() => {
    const enforceSubscriptionLimits = async () => {
      if (auth.user && rules.length > 0) {
        const activeRules = rules.filter(rule => rule.isActive);
        const subscriptionProductId = auth.user.subscriptionProductId;

        let limit = 0;
        if (subscriptionProductId === 'prod_R0b23M9NcTgjfF') {
          limit = Infinity; // Premium has no limit
        } else if (subscriptionProductId === 'prod_R22J6iyXBxcFLX') {
          limit = 4; // Standard subscription limit
        } else if (subscriptionProductId === 'prod_R0auXMo4nOGFkM') {
          limit = 1; // Single subscription limit
        }

        if (activeRules.length > limit) {
          const mostRecentRule = rules.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))[0];

          // Show SweetAlert popup to give the user the choice to toggle off the rule or upgrade
          Swal.fire({
            title: 'Subscription Limit Reached',
            text: `You can only have ${limit} active rules. Would you like to turn off your most recent rule or upgrade your plan?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Turn Off Recent Rule',
            cancelButtonText: 'Upgrade Plan',
            reverseButtons: true
          }).then(async (result) => {
            await forceOff(mostRecentRule._id, false);

            if (result.isConfirmed) {
              // User chose to toggle off the most recent rule
              

              // Update the rule list in the state
              setRules(prevRules =>
                prevRules.map(rule =>
                  rule._id === mostRecentRule._id ? { ...rule, isActive: false } : rule
                )
              );

              Swal.fire(
                'Success!',
                'The most recent rule has been turned off.',
                'success'
              );
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              // User chose to upgrade their plan
              window.open('https://billing.stripe.com/p/login/test_4gw9AB4FsdAJc80dQQ', '_blank');
            }
          });
        }
      }
    };

    enforceSubscriptionLimits();
  }, [auth.user, rules]);

  const forceOff = async (ruleId, isActive) => {
    try {
      const action = "deactivate"
      const userId = auth.user.id;
      const url = `/rules/${ruleId}/${action}`;
      const response = await axiosInstance.put(url, { userId });

      if (response.status === 200) {
        // Update the rule's active state in the local state
        setRules(prevRules =>
          prevRules.map(rule =>
            rule._id === ruleId ? { ...rule, isActive } : rule
          )
        );

      } else {
        Swal.fire('Error!', `Failed to ${action} rule.`, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error!', 'An error occurred while trying to toggle the rule.', 'error');
    }
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

  const handleDeleteRule = (ruleId) => {
    setRules(prevRules => prevRules.filter(rule => rule._id !== ruleId));
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
                    <RuleCard 
                    key={rule._id || index} 
                    rule={rule} 
                    onToggle={handleToggleRule} 
                    activeRulesCount={activeRulesCount} 
                    subscriptionLimit={subscriptionLimit} 
                    onDelete={handleDeleteRule}/>
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
