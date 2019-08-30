import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar, faTruck } from '@fortawesome/free-solid-svg-icons';
import './App.css';

export default () => (
  <div className="fadein">
    <div className="spinner">
      <FontAwesomeIcon icon={faCar} size="10x" color="#1D3C4C" />
    </div>
    <div className="rolling">
      <FontAwesomeIcon icon={faTruck} size="10x" color="#1D3C4C" />
    </div>
  </div>
);
