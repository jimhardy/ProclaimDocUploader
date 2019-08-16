import React, { Component } from 'react';

class Login extends Component {
  state = {
    caseRef: null,
    password: null
  };

  handleChange = evt => {
    this.setState({ [evt.target.name]: evt.target.value });
  };

  handleSubmit = evt => {
    evt.preventDefault();
    console.log(evt);
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
              type="password"
              name="password"
              value={this.state.password || ''}
              onChange={this.handleChange}
              placeholder="Password"
              id="password"
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
