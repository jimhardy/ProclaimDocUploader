import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';

class Image extends Component {
  state = { value: '' };

  handleChange = async evt => {
    await this.setState({ value: evt.target.value });
    this.props.handleChange(this.props.image.id, this.state.value);
  };

  render() {
    return (
      <div key={this.props.id}>
        <div className="fadein">
          <div
            onClick={() => this.props.removeImage(this.props.image.name)}
            className="delete"
          >
            <FontAwesomeIcon icon={faTimesCircle} size="2x" />
          </div>
          <img
            src={this.props.image.url}
            alt=""
            ket={this.props.image.id}
            onError={() => this.props.onError(this.props.image.id)}
            onClick={() => window.open(this.props.image.url, '_blank')}
          />
        </div>
        <textarea
          className="Image-description"
          type="text"
          placeholder="image description"
          onChange={this.handleChange}
          value={this.props.value}
        />
      </div>
    );
  }
}

export default Image;
