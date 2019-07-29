import React from 'react';
import AvatarEditor from 'react-avatar-editor';
import firebase from '../../firebase';
import {
  Grid,
  Header,
  Icon,
  Dropdown,
  Image,
  Modal,
  Input,
  Button
} from 'semantic-ui-react';

class UserPanel extends React.Component {
  state = {
    user: this.props.currentUser,
    modal: false,
    previewImage: '',
    croppedImage: '',
    blob: '',
    storageRef: firebase.storage().ref(),
    usersRef: firebase.database().ref('users'),
    userRef: firebase.auth().currentUser,
    metadata: {
      contentType: 'image/jpeg'
    },
    uploadedCroppedImage: ''
  };

  handleChange = event => {
    const file = event.target.files[0];
    const reader = new FileReader();
    if (file) {
      reader.readAsDataURL(file);
      reader.addEventListener('load', () => {
        this.setState({ previewImage: reader.result });
      });
      //   this.setState({ file });
    }
  };

  handleCropImage = () => {
    if (this.avatarEditor) {
      this.avatarEditor.getImageScaledToCanvas().toBlob(blob => {
        let imageUrl = URL.createObjectURL(blob);
        this.setState({ croppedImage: imageUrl, blob });
      });
    }
  };

  uploadCroppedImage = () => {
    const { userRef, storageRef, blob, croppedImage, metadata } = this.state;
    if (croppedImage) {
      storageRef
        .child(`avatars/users/${userRef.uid}`)
        .put(blob, metadata)
        .then(snap => {
          console.log('snap', snap);
          snap.ref.getDownloadURL().then(downloadURL => {
            this.setState({ uploadedCroppedImage: downloadURL }, () =>
              this.changeAvatar()
            );
          });
        })
        .catch(err => console.log(err, 'error saving in storage'));
    }
  };

  changeAvatar = () => {
    const { userRef, usersRef, uploadedCroppedImage, user } = this.state;
    userRef
      .updateProfile({
        photoURL: uploadedCroppedImage
      })
      .then(() => {
        console.log('avatar updated!');
        this.closeModal();
      })
      .catch(err => console.log('error changing avatar', err));
    usersRef
      .child(user.uid)
      .update({ avatar: uploadedCroppedImage })
      .then(() => {
        console.log('updated user avatar');
      })
      .catch(err => console.log(err, 'upload err'));
  };

  closeModal = () => this.setState({ modal: false });

  openModal = () => this.setState({ modal: true });

  dropdownOptions = () => [
    {
      key: 'user',
      text: (
        <span>
          Signed in as <strong>{this.state.user.displayName}</strong>
        </span>
      ),
      disabled: true
    },
    {
      key: 'avatar',
      text: <span onClick={this.openModal}>Change Avatar</span>
    },
    {
      key: 'signout',
      text: <span onClick={this.handleSignout}>Sign Out</span>
    }
  ];

  handleSignout = () => {
    firebase
      .auth()
      .signOut()
      .then(() => console.log('signed out!'));
  };

  render() {
    const { modal, user, previewImage, croppedImage } = this.state;
    const { primaryColor } = this.props;
    return (
      <Grid style={{ background: primaryColor }}>
        <Grid.Column>
          <Grid.Row style={{ padding: '1.2em', margin: 0 }}>
            {/* App Header */}
            <Header inverted floated='left' as='h2'>
              <Icon name='code' />
              <Header.Content>Connect/></Header.Content>
            </Header>

            {/* User Dropdown  */}
            <Header style={{ padding: '0.25em' }} as='h4' inverted>
              <Dropdown
                trigger={
                  <span>
                    <Image src={user.photoURL} spaced='right' avatar />
                    {user.displayName}
                  </span>
                }
                options={this.dropdownOptions()}
              />
            </Header>
          </Grid.Row>
        </Grid.Column>
        <Modal basic open={modal} onClose={this.closeModal}>
          <Modal.Header>Change avatar</Modal.Header>
          <Modal.Content>
            <Input
              onChange={e => this.handleChange(e)}
              fluid
              label='New Avatar'
              name='previewImage'
              type='file'
            />
            <Grid centered stackable columns={2}>
              <Grid.Row centered>
                <Grid.Column className='ui center aligned grid'>
                  {previewImage && (
                    <AvatarEditor
                      ref={node => (this.avatarEditor = node)}
                      image={previewImage}
                      width={120}
                      height={120}
                      border={50}
                      scale={1.2}
                    />
                  )}
                </Grid.Column>
                <Grid.Column className='ui center aligned grid'>
                  {/* Cropped Image Preview */}
                  {croppedImage && (
                    <Image
                      style={{ margin: '3.5em auto' }}
                      width={100}
                      height={100}
                      src={croppedImage}
                    />
                  )}
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Modal.Content>
          <Modal.Actions>
            {croppedImage && (
              <Button onClick={this.uploadCroppedImage} color='green' inverted>
                <Icon name='save' /> Change Avatar
              </Button>
            )}
            <Button onClick={this.handleCropImage} color='green' inverted>
              <Icon name='image' /> Preview
            </Button>
            <Button color='red' inverted onClick={this.closeModal}>
              <Icon name='remove' /> Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </Grid>
    );
  }
}

export default UserPanel;
