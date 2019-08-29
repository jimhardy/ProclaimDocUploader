import React, { Component } from 'react';
import Spinner from './Spinner';
import Login from './login';
import Image from './Image';
import axios from 'axios';
import Upload from './Upload';
import { API_URL } from './config';
// import uuid from 'uuid/v4';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default class App extends Component {
  state = {
    loading: true,
    images: [],
    login: {
      caseRef: '',
      vehReg: ''
    },
    loggedIn: false
  };

  componentDidMount() {
    fetch(`${API_URL}/wake-up`).then(res => {
      if (res.ok) {
        return this.setState({ loading: false });
      }
      toast.error('No response from server', {
        position: toast.POSITION.TOP_CENTER
      });
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
            images: images.map(image => {
              return { ...image, description: '' };
            })
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

  removeImage = async id => {
    axios.post(`${API_URL}/delete-image`, { id }).then(res => {
      if (res.status === 200) {
        console.log('deleted');
      }
    });
    const updatedArr = await this.state.images.filter(
      image => image.public_id !== id
    );

    await this.setState(st => ({
      images: updatedArr
    }));
  };

  addImageDescription = async (id, value) => {
    const updatedArr = await this.state.images.map(image => {
      if (image.public_id === id) {
        return { ...image, description: value };
      }
      return image;
    });
    await this.setState({ images: updatedArr });
  };

  onError = id => {
    this.setState({ images: this.filter(id) });
  };

  onLogin = async evt => {
    await this.setState(st => ({ login: evt, loading: true }));
    console.log(this.state.loading);
    const login = await this.state.login;

    await axios
      .post(`${API_URL}/login`, {
        caseRef: login.caseRef,
        vehReg: login.vehReg
      })
      .then(res => {
        if (res.data) {
          this.setState({ loggedIn: true });
        } else {
          toast.error('Invalid Case Reference or Vehicle Registration', {
            position: toast.POSITION.TOP_CENTER
          });
        }
      });
    this.setState({ loading: false });
  };

  uploadToProclaim = async evt => {
    const uploadArr = this.state.images.map(image => {
      return {
        imageUrl: image.secure_url,
        description: image.description,
        timestamp: new Date()
      };
    });
    console.log(uploadArr);
  };

  render() {
    const { loading, images, loggedIn } = this.state;

    const content = () => {
      switch (true) {
        case loading:
          return <Spinner />;
        case !loggedIn:
          return <Login handleSubmit={this.onLogin} />;
        case images.length > 0:
          return (
            <div>
              <button className="Form-button" onClick={this.uploadToProclaim}>
                Upload all to Proclaim
              </button>
              {this.state.images.map((image, i) => (
                <Image
                  removeImage={this.removeImage}
                  image={image}
                  onError={this.onError}
                  handleChange={this.addImageDescription}
                  id={i}
                  key={image.public_id}
                  value={image.description}
                />
              ))}
            </div>
          );
        default:
          return <Upload onChange={this.onChange} />;
      }
    };

    return (
      <div className="container">
        <ToastContainer />
        <div className="button">{content()}</div>
      </div>
    );
  }
}
