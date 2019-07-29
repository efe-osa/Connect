import React from 'react';
import {
  Sidebar,
  Menu,
  Divider,
  Button,
  Modal,
  Icon,
  Label,
  Segment
} from 'semantic-ui-react';
import { connect } from 'react-redux';
import { SliderPicker } from 'react-color';
import { setColors } from '../../actions';
import firebase from '../../firebase';

class ColorPanel extends React.Component {
  state = {
    modal: false,
    primary: '',
    secondary: '',
    usersRef: firebase.database().ref('users'),
    user: this.props.currentUser,
    userColors: []
  };

  componentDidMount() {
    const { user } = this.state;
    if (user) this.addListener(user.uid);
  }

  componentWillUnmount() {
    this.removeListener();
  }

  removeListeners = () => {
    this.state.usersRef.off();
  };

  addListener = userId => {
    const { usersRef } = this.state;
    let userColors = [];
    usersRef.child(`${userId}/colors`).on('child_added', snap => {
      userColors.unshift(snap.val());
      console.log(userColors);
      this.setState({ userColors });
    });
  };

  displayUserColors = colors =>
    colors.length > 0 &&
    colors.map((color, i) => (
      <React.Fragment key={i}>
        <Divider />
        <div
          className='color__containers'
          onClick={() => this.props.setColors(color.primary, color.secondary)}
        >
          <div className='color__square' style={{ background: color.primary }}>
            <div
              className='color__overlay'
              style={{ background: color.secondary }}
            />
          </div>
        </div>
      </React.Fragment>
    ));

  closeModal = () => this.setState({ modal: false });

  openModal = () => this.setState({ modal: true });

  handleChangePrimary = color => {
    return this.setState({ primary: color.hex });
  };

  handleChangeSecondary = color => {
    return this.setState({ secondary: color.hex });
  };

  handleSaveColors = () => {
    const { primary, secondary } = this.state;
    if (primary && secondary) {
      this.saveColors(primary, secondary);
    }
  };

  saveColors = (primary, secondary) => {
    const { usersRef, user } = this.state;
    usersRef
      .child(`${user.uid}/colors`)
      .push()
      .update({ primary, secondary })
      .then(() => {
        console.log('colors added');
        this.closeModal();
      })
      .catch(err => console.log(err));
  };

  render() {
    const { modal, primary, secondary, userColors } = this.state;
    return (
      <Sidebar
        as={Menu}
        icon='labeled'
        inverted
        vertical
        visible
        width='very thin'
      >
        <Divider />
        <Button icon='add' size='small' color='blue' onClick={this.openModal} />
        {this.displayUserColors(userColors)}
        {/* color picker */}
        <Modal basic open={modal} onClose={this.closeModal}>
          <Modal.Header>Choose App Colors</Modal.Header>
          <Modal.Content>
            <Segment inverted>
              <Label content='Primary Color' />
              <SliderPicker
                color={primary}
                onChange={e => this.handleChangePrimary(e)}
              />
            </Segment>
            <Segment inverted>
              <Label content='Secondary Color' />
              <SliderPicker
                color={secondary}
                onChange={e => this.handleChangeSecondary(e)}
              />
            </Segment>
          </Modal.Content>
          <Modal.Actions>
            <Button inverted color='green' onClick={this.handleSaveColors}>
              <Icon name='checkmark' />
              Save
            </Button>
            <Button inverted color='red'>
              <Icon name='checkmark' />
              Remove
            </Button>
          </Modal.Actions>
        </Modal>
      </Sidebar>
    );
  }
}

export default connect(
  null,
  { setColors }
)(ColorPanel);
