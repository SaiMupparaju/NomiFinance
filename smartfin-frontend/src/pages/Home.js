import React, { useState, useEffect,  } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFact } from '../contexts/FactContext'; 
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '../contexts/AccountsContext'; // Use the new Accounts Context
import { getUserRules } from '../utils/rule_api'; 
import RuleCard from './components/RuleCard';
import SettingsModal from './components/SettingsModal';
import { Button, Container, Row, Col, Nav } from 'react-bootstrap';
import Swal from "sweetalert2";
import MyNavbar from './components/MyNavbar';
import Applet from './components/Applet';
import { appletConfigs, processAppletConfig } from './components/AppletConfigs';
import axiosInstance from '../utils/axiosInstance';
import './styles/Home.css';

function Home() {
  const { auth, logout } = useAuth();
  const { accounts: bankAccounts, refreshAccounts, loading, error } = useAccounts(); // Access bank accounts from context
  console.log("bank accounts:", bankAccounts);
  const navigate = useNavigate();
  const { factTree, refetchFactTree } = useFact();
  
  const [rules, setRules] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [layoutOption, setLayoutOption] = useState('large'); // Default to small layout
  const [banksNeedUpdate, setBanksNeedUpdate] = useState(false); // To track if any bank needs update


  const [subscriptionLimit, setSubscriptionLimit] = useState(0);
  const [activeRulesCount, setActiveRulesCount] = useState(0);
  const [activeTab, setActiveTab] = useState('applets');

  const hasBankAccounts = 
  (bankAccounts && Object.values(bankAccounts).some(accountsArray => Array.isArray(accountsArray) && accountsArray.length > 0)) ||
  (factTree && !factTree.some(node => node.label === "Guest Bank"));


  const handleAppletSelect = (config) => {
    navigate('/applet-form', { 
      state: { appletId: config.id }  // pass the config’s ID
    });
  };

  useEffect(() => {
    if (auth.user) {
      const subscriptionProductId = auth.user.subscriptionProductId;

      let limit = 0;
      if (subscriptionProductId === process.env.REACT_APP_NOMI_PREMIUM) {
        limit = Infinity; // Premium has no limit
      } else if (subscriptionProductId === process.env.REACT_APP_NOMI_STANDARD) {
        limit = 4; // Standard subscription limit
      } else {
        limit = 1; // No subscription
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
    if (auth.user && bankAccounts) {
      const bankWithErrors = Object.entries(bankAccounts).find(([bankName, accounts]) =>
        accounts.some(account => account.needsUpdate)
      );
  
      if (bankWithErrors) {
        const [bankName] = bankWithErrors;
        Swal.fire({
          title: 'Account Update Required',
          text: `Your ${bankName} connection needs to be updated. Would you like to update it now?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Update Now',
          cancelButtonText: 'Remind Me Later',
          showDenyButton: process.env.REACT_APP_ENV === 'development',
          denyButtonText: 'Test Force Update (Dev)',
        }).then(async (result) => {
          if (result.isConfirmed) {
            setShowSettingsModal(true);
          } else if (result.isDenied && process.env.REACT_APP_ENV === 'development') {
            try {
              await axiosInstance.post('/plaid/force-reset-login', {
                bankName: bankName,
              });
              await refreshAccounts();
            } catch (error) {
              console.error('Error forcing update mode:', error);
            }
          }
        });
      }
    }
  }, [bankAccounts, auth.user]);

  const TestControls = () => {
    if (process.env.REACT_APP_ENV !== 'development') return null;
  
    return (
      <div className="test-controls mb-3">
        <Button 
          variant="warning" 
          size="sm"
          onClick={handleForceUpdateMode}
          className="me-2"
        >
          Force Update Mode (Test)
        </Button>
      </div>
    );
  };

  const handleForceUpdateMode = async () => {
    console.log("force update pressed");
    try {

      if (!bankAccounts) {
        console.log("No bank accounts found");
        return;
      }
      console.log("Available banks:", Object.keys(bankAccounts));
      
      const bankNames = Object.keys(bankAccounts);
      let selectedBank;
  
      if (bankNames.length > 1) {
        const { value: bankName } = await Swal.fire({
          title: 'Select Bank',
          input: 'select',
          inputOptions: bankNames.reduce((acc, bank) => {
            acc[bank] = bank;
            return acc;
          }, {}),
          inputPlaceholder: 'Select a bank',
          showCancelButton: true,
        });
        
        if (bankName) {
          selectedBank = bankName;
        }
      } else if (bankNames.length === 1) {
        selectedBank = bankNames[0];
      }
  
      if (selectedBank) {
        console.log("Selected bank:", selectedBank);
        const response = await axiosInstance.post('/plaid/force-reset-login', {
          bankName: selectedBank,
        });
        console.log("API Response:", response);
        
        Swal.fire({
          title: 'Success',
          text: 'Account forced into update mode. Refreshing data...',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
  
        await refreshAccounts();
      } else {
        console.log("No bank was selected");
      }
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Swal.fire({
        title: 'Error',
        text: 'Failed to force update mode',
        icon: 'error'
      });
    }
  };

  useEffect(() => {
    console.log("HOME fact tree", factTree);
    console.log("HOME bank accounts", bankAccounts);
  }, [factTree, bankAccounts])

  // useEffect(() => {
  //   if (banksNeedUpdate) {
  //     alert('Some of your bank accounts need to be updated.');
  //     setShowSettingsModal(true); // Automatically show modal if any bank needs update
  //   }
  // }, [banksNeedUpdate]);

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
    navigate('/create-rule', { state: { userRules: rules, hasBankAccounts} });
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
        if (subscriptionProductId === process.env.REACT_APP_NOMI_PREMIUM) {
          limit = Infinity; // Premium has no limit
        } else if (subscriptionProductId === process.env.REACT_APP_NOMI_STANDARD) {
          limit = 4; // Standard subscription limit
        } else {
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
              window.open(process.env.REACT_APP_STRIPE_BILLING_LINK, '_blank');
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


  // Function to initiate the payment
  const handlePayment = () => {
    navigate('/pricing'); // Replace '/pricing' with the actual route to your Pricing Table
  };

  const handleDeleteRule = (ruleId) => {
    setRules(prevRules => prevRules.filter(rule => rule._id !== ruleId));
  };

  const goToAppletsTab = () => {
    setActiveTab('applets');
  };

  return (
    <>
      <MyNavbar
        hasBankAccounts={hasBankAccounts}
        handleCreateRule={handleCreateRule}
        handleLayoutChange={handleLayoutChange}
        setShowSettingsModal={setShowSettingsModal}
        authUser={auth.user}
        handleLogout={logout}
        subscriptionStatus={auth.user?.subscriptionStatus}
      />

      <div className="home-container">

        {/* TABS for "My Rules" vs "Applets" */}
        <Nav 
          variant="tabs" 
          activeKey={activeTab} 
          onSelect={(selectedKey) => setActiveTab(selectedKey)}
          className="mb-3"
        >
          <Nav.Item>
            <Nav.Link eventKey="rules">My Rules</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="applets">Premade Rules</Nav.Link>
          </Nav.Item>
        </Nav>

        <Container fluid>
          {/** If "rules" tab is selected, show user’s existing rules */}
          {activeTab === 'rules' && (
            <>
              {rules.length === 0 ? (
                <div className="text-center my-5">
                  <h1 style={{ fontSize: '4rem' }}>😕</h1>
                  <h3 className="mb-4">So empty... Why not</h3>

                  <Row className="justify-content-center">
                    <Col md={6} lg={4} className="mb-4">
                      <Button 
                        onClick={handleCreateRule} 
                        size="lg" 
                        variant="primary" 
                        className="w-100"
                      >
                        Create Custom Rule?
                      </Button>
                    </Col>
                  </Row>

                      {/* "Or" text */}
                    <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>Or</p>

                    {/* Second button */}
                    <Row className="justify-content-center">
                      <Col md={6} lg={4}>
                        <Button
                          onClick={goToAppletsTab}
                          size="lg"
                          variant="primary"
                          className="w-100"
                        >
                          Check Out Our Premade Rules
                        </Button>
                      </Col>
                    </Row>
                </div>
              ) : (
                <Row className="justify-content-center">
                  {rules.map((rule, index) => {
                    const colSize = getColSize(layoutOption);
                    return (
                      <Col 
                        key={rule._id || index} 
                        {...colSize} 
                        className="mb-4 d-flex"
                      >
                        <RuleCard
                          rule={rule}
                          onToggle={handleToggleRule}
                          activeRulesCount={activeRulesCount}
                          subscriptionLimit={subscriptionLimit}
                          onDelete={handleDeleteRule}
                        />
                      </Col>
                    );
                  })}
                </Row>
              )}
            </>
          )}

          {/** If "applets" tab is selected, show all applet configs */}
          {activeTab === 'applets' && (
            <Row className="mt-3">
              {Object.keys(appletConfigs).map((key) => {
                const config = appletConfigs[key];
                return (
                  <Col 
                    md={6} 
                    lg={4} 
                    className="mb-4 d-flex justify-content-center" 
                    key={key}
                  >
                    <Applet 
                      config={config} 
                      onSelect={handleAppletSelect}
                    />
                  </Col>
                );
              })}
            </Row>
          )}
        </Container>

        {/* Settings Modal for bank updates */}
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
