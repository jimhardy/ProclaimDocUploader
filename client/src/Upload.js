import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileUpload } from '@fortawesome/free-solid-svg-icons';

export default props => (
  <div className="Upload-button fadein">
    <label htmlFor="multi">
      <FontAwesomeIcon icon={faFileUpload} color="#6d84b4" size="10x" />
    </label>
    <input type="file" id="multi" onChange={props.onChange} multiple />
  </div>
);
