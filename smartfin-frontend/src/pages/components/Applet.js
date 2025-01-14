// src/pages/components/Applet.js
import React from 'react';
import { Card, Button } from 'react-bootstrap';

function Applet({ config, onSelect }) {
  const {
    icon,
    title,
    description,         // <--- NEW: read “description” from the config
  } = config;
  
  return (
    <Card className="shadow-sm hover-shadow h-100" style={{ minWidth: '270px' }}>
      {/* 
        h-100 => let the card stretch to 100% of its container’s height
        minWidth => ensures all cards have about the same width. 
        Adjust as needed 
      */}
      <Card.Body className="d-flex flex-column align-items-center text-center p-4">
        <div className="mb-3">
          <span style={{ fontSize: '2.5rem' }}>{icon}</span>
        </div>
        <h4 className="fw-bold">{title}</h4>
        
        {/* Only display a description if it exists */}
        {description && (
          <p className="text-muted mt-2">
            {description}
          </p>
        )}

        {/* 
          “mt-auto” pushes this button to the bottom of the card,
          ensuring consistent vertical spacing in all cards 
        */}
        <div className="mt-auto">
          <Button
            variant="primary"
            onClick={() => onSelect(config)}
          >
            Connect
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default Applet;
