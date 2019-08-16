import React, { Component } from 'react';
// import Notifications, { notify } from 'react-notify-toast';
import Spinner from './Spinner';
import Images from './Images';
import Buttons from './Buttons';
import { API_URL } from './config';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default class App extends Component {
  state = {
    loading: true,
    uploading: false,
    images: []
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
      this.setState({ uploading: true });

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
            uploading: false,
            images
          });
        })
        .catch(err => {
          this.setState({ uploading: false });
        });
    } catch (e) {
      this.setState({ uploading: false });
    }
  };

  filter = id => {
    return this.state.images.filter(image => image.public_id !== id);
  };

  removeImage = id => {
    this.setState({ images: this.filter(id) });
  };

  onError = id => {
    this.setState({ images: this.filter(id) });
  };

  render() {
    const { loading, uploading, images } = this.state;

    const content = () => {
      switch (true) {
        case loading || uploading:
          return <Spinner />;
        case images.length > 0:
          return (
            <div>
              <Images
                images={images}
                removeImage={this.removeImage}
                onError={this.onError}
              />
              <button className="Button-push">Upload to Proclaim</button>
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
