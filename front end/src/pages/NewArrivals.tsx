import React from 'react';
import Shop from './Shop';

export default function NewArrivals() {
  return (
    <Shop 
      forcedNew={true}
      customHeadline="New ways to make the work clearer."
      customDescription="The latest additions to our digital toolkit library, updated with contemporary design standards and validated workflows."
    />
  );
}
