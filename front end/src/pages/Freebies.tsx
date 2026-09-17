import React from 'react';
import Shop from './Shop';

export default function Freebies() {
  return (
    <Shop 
      forcedFree={true}
      customHeadline="Free resources for capable teams."
      customDescription="Community starter kits, documentation templates, and baseline blueprints available at zero cost."
    />
  );
}
