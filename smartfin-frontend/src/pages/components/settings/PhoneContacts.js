import React from 'react';
import { Button } from 'react-bootstrap';

const PhoneContacts = () => {
  return (
    <div className="card-body">
      <h5>Phone Contacts</h5>
      <form>
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input type="text" className="form-control" placeholder="Enter your phone number" />
        </div>
        <Button variant="primary">Save Changes</Button>
      </form>
    </div>
  );
};

export default PhoneContacts;
