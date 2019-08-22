import React, { Component } from 'react';

class Login extends Component {
  state = {
    caseRef: null,
    vehReg: null
  };

  handleChange = evt => {
    this.setState({ [evt.target.name]: evt.target.value });
  };

  handleSubmit = evt => {
    evt.preventDefault();
    this.props.handleSubmit(this.state);
  };

  render() {
    return (
      <div>
        <h1>Image Upload Portal</h1>
        <div className="Form-wrapper">
          <form onSubmit={this.handleSubmit} className="Form">
            <input
              type="text"
              name="caseRef"
              value={this.state.caseRef || ''}
              onChange={this.handleChange}
              placeholder="Case Reference"
              id="caseRef"
              className="Form-input"
            />
            <input
              type="text"
              name="vehReg"
              value={this.state.vehReg || ''}
              onChange={this.handleChange}
              placeholder="Vehicle Registration"
              id="vehReg"
              className="Form-input"
            />
            <button className="Form-button">Login</button>
          </form>
        </div>
      </div>
    );
  }
}

export default Login;
