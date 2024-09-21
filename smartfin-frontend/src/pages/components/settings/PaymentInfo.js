import React from 'react';
import { Button } from 'react-bootstrap';

const PaymentInfo = () => {
  return (
    <div className="card-body">
      <h5>Payment Information</h5>
      <form>
        <div className="form-group">
          <label className="form-label">Credit Card Number</label>
          <input type="text" className="form-control" placeholder="Enter your credit card number" />
        </div>
        <div className="form-group">
          <label className="form-label">Expiration Date</label>
          <input type="text" className="form-control" placeholder="MM/YY" />
        </div>
        <Button variant="primary">Save Changes</Button>
      </form>
    </div>
  );
};

export default PaymentInfo;
