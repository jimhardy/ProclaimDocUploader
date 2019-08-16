import React, { Component } from 'react';
// import Notifications, { notify } from 'react-notify-toast';
import Spinner from './Spinner';
import Login from './login';
import Images from './Images';
import Buttons from './Buttons';
import { API_URL } from './config';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default class App extends Component {
  state = {
    loading: true,
    images: [],
    login: {
      caseRef: '',
      password: ''
    }
  };

  componentDidMount() {
    fetch(`${API_URL}/wake-up`).then(res => {
      if (res.ok) {
        return this.setState({ loading: false });
      }
      toast('No response from server');
    });
  }

  onChange = e => {
    const files = Array.from(e.target.files);

    if (files.length > 10) {
      toast.error('Only 10 images can be uploaded at a time', {
        position: toast.POSITION.TOP_CENTER
      });
    }

    const formData = new FormData();
    const types = ['image/png', 'image/jpeg', 'image/gif'];

    files.forEach((file, i) => {
      let err = [];
      if (types.every(type => file.type !== type)) {
        let msg = 'Not a supported format';
        err.push(msg);
        toast.error(msg, {
          position: toast.POSITION.TOP_CENTER
        });
      }

      if (file.size > 2000000) {
        let msg = 'Image is too large, please select a smaller file';
        err.push(msg);
        toast.error(msg, {
          position: toast.POSITION.TOP_CENTER
        });
      }
      if (!err.length) {
        formData.append(i, file);
      }
    });

    try {
      this.setState({ loading: true });

      fetch(`${API_URL}/image-upload`, {
        method: 'POST',
        body: formData
      })
        .then(res => {
          if (!res.ok) {
            toast.info(
              'Please check the images are correct and click Push to Case',
              { position: toast.POSITION.TOP_CENTER }
            );
            throw res;
          }
          return res.json();
        })
        .then(images => {
          this.setState({
            loading: false,
            images
          });
        })
        .catch(err => {
          this.setState({ loading: false });
        });
    } catch (e) {
      this.setState({ loading: false });
    }
  };

  filter = id => {
    return this.state.images.filter(image => image.public_id !== id);
  };

  removeImage = id => {
    console.log(id);
    fetch(`${API_URL}/delete-image`, {
      method: 'POST',
      body: id
    });
    this.setState({ images: this.filter(id) });
  };

  onError = id => {
    this.setState({ images: this.filter(id) });
  };

  onLogin = evt => {
    this.setState({ login: evt });
  };

  render() {
    const { loading, images, login } = this.state;

    const content = () => {
      switch (true) {
        case !login.caseRef && !login.password:
          return <Login handleSubmit={this.onLogin} />;
        case loading:
          return <Spinner />;
        case images.length > 0:
          return (
            <div>
              <Images
                images={images}
                removeImage={this.removeImage}
                onError={this.onError}
              />
              <button className="Form-button">Upload to Proclaim</button>
            </div>
          );
        default:
          return <Buttons onChange={this.onChange} />;
      }
    };

    return (
      <div className="container">
        <ToastContainer />
        <div className="buttons">{content()}</div>
      </div>
    );
  }
}
