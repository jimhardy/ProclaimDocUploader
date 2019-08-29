import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar, faTruck, faCarCrash } from '@fortawesome/free-solid-svg-icons';
import './App.css';

export default () => (
  <div className="fadein">
    <div className="spinner">
      <FontAwesomeIcon icon={faCar} size="10x" color="#1D3C4C" />
      <div className="crash">
        <FontAwesomeIcon icon={faCarCrash} size="10x" color="#1D3C4C" />
      </div>
    </div>
    <div className="rolling">
      <FontAwesomeIcon icon={faTruck} size="10x" color="#1D3C4C" />
    </div>
  </div>
);
