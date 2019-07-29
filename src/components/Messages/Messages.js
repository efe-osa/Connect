import React from 'react';
import { Segment, Comment } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { setUserPosts } from '../../actions';
import firebase from '../../firebase';

import MessagesHeader from './MessagesHeader';
import MessageForm from './MessageForm';
import Message from './Message';
import Typing from './Typing';
import Skeleton from './Skeleton';

class Messages extends React.Component {
  state = {
    privateChannel: this.props.isPrivateChannel,
    privateMessagesRef: firebase.database().ref('privateMessages'),
    messagesRef: firebase.database().ref('messages'),
    messages: [],
    messagesLoading: true,
    channel: this.props.currentChannel,
    isChannelStarred: false,
    user: this.props.currentUser,
    usersRef: firebase.database().ref('users'),
    typingRef: firebase.database().ref('typing'),
    connectedRef: firebase.database().ref('.info/connected'),
    numUniqueUsers: '',
    searchTerm: '',
    searchLoading: false,
    searchResults: [],
    typingUsers: [],
    listeners: []
  };

  componentDidMount() {
    const { channel, user } = this.state;

    if (channel && user) {
      this.addListeners(channel.id);
      this.addUserStarsListener(channel.id, user.uid);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.messageEnd) {
      this.scrollToBottom();
    }
  }
  componentWillUnmount() {
    const { connectedRef } = this.state;
    this.removeListeners(this.state.listeners);
    connectedRef.off();
  }

  scrollToBottom = () => {
    this.messageEnd.scrollIntoView({ behavior: 'smooth' });
  };

  removeListeners = listeners => {
    listeners.forEach(listener =>
      listener.ref.child(listener.id).off(listener.event)
    );
  };

  addToListeners = (id, ref, event) => {
    const { listeners } = this.state;
    const idx = listeners.findIndex(
      listener =>
        listener.id === id && listener.ref === ref && listener.event === event
    );
    if (idx === -1) {
      const newListener = {
        id,
        ref,
        event
      };

      this.setState({ listeners: listeners.concat(newListener) });
    }
  };

  addListeners = channelId => {
    this.addMessageListener(channelId);
  };

  addTypingListeners = channelId => {
    let typingUsers = [];
    const { typingRef, connectedRef, user } = this.state;
    typingRef.child(channelId).on('child_added', snap => {
      if (snap.key !== user.uid) {
        typingUsers.concat({
          id: snap.key(),
          name: snap.val()
        });
        this.setState({ typingUsers });
      }
    });

    this.addToListeners(channelId, typingRef, 'child_added');

    typingRef.child(channelId).on('child_removed', snap => {
      const idx = typingUsers.findIndex(user => user.id === snap.key);
      if (idx !== -1) {
        typingUsers = typingUsers.filter(user => user.id !== snap.key);
        this.setState({ typingUsers });
      }
    });
    this.addToListeners(channelId, typingRef, 'child_removed');

    connectedRef.on('value', snap => {
      if (snap.val() === true) {
        typingRef
          .child(channelId)
          .child(user.uid)
          .onDisconnect()
          .remove(err => {
            if (err !== null) {
              console.log(err);
            }
          });
      }
    });
  };

  addMessageListener = channelId => {
    let loadedMessages = [];
    const ref = this.getMessagesRef();
    ref.child(channelId).on('child_added', snap => {
      loadedMessages.push(snap.val());
      this.setState({
        messages: loadedMessages,
        messagesLoading: false
      });
      this.countUniqueUsers(loadedMessages);
      this.countUserPosts(loadedMessages);
    });

    this.addToListeners(channelId, ref, 'child_added');
  };

  addUserStarsListener = (channelId, userId) => {
    this.state.usersRef
      .child(userId)
      .child('starred')
      .once('value')
      .then(data => {
        if (data.val() !== null) {
          const channelIds = Object.keys(data.val());
          const prevStarred = channelIds.includes(channelId);
          this.setState({ isChannelStarred: prevStarred });
        }
      });
  };

  getMessagesRef = () => {
    const { messagesRef, privateMessagesRef, privateChannel } = this.state;
    return privateChannel ? privateMessagesRef : messagesRef;
  };

  handleStar = () => {
    this.setState(
      prevState => ({
        isChannelStarred: !prevState.isChannelStarred
      }),
      () => this.starChannel()
    );
  };

  starChannel = () => {
    if (this.state.isChannelStarred) {
      this.state.usersRef.child(`${this.state.user.uid}/starred`).update({
        [this.state.channel.id]: {
          name: this.state.channel.name,
          details: this.state.channel.details,
          createdBy: {
            name: this.state.channel.createdBy.name,
            avatar: this.state.channel.createdBy.avatar
          }
        }
      });
    } else {
      this.state.usersRef
        .child(`${this.state.user.uid}/starred`)
        .child(this.state.channel.id)
        .remove(err => {
          if (err !== null) {
            console.error(err);
          }
        });
    }
  };

  handleSearchChange = event => {
    this.setState(
      {
        searchTerm: event.target.value,
        searchLoading: true
      },
      () => this.handleSearchMessages()
    );
  };

  handleSearchMessages = () => {
    const channelMessages = [...this.state.messages];
    const regex = new RegExp(this.state.searchTerm, 'gi');
    const searchResults = channelMessages.reduce((acc, message) => {
      if (
        (message.content && message.content.match(regex)) ||
        message.user.name.match(regex)
      ) {
        acc.push(message);
      }
      return acc;
    }, []);
    this.setState({ searchResults });
    setTimeout(() => this.setState({ searchLoading: false }), 1000);
  };

  countUniqueUsers = messages => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.user.name)) {
        acc.push(message.user.name);
      }
      return acc;
    }, []);
    const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
    const numUniqueUsers = `${uniqueUsers.length} user${plural ? 's' : ''}`;
    this.setState({ numUniqueUsers });
  };

  countUserPosts = messages => {
    let userPosts = messages.reduce((acc, message) => {
      if (message.user.name in acc) {
        acc[message.user.name].count += 1;
      } else {
        acc[message.user.name] = {
          avatar: message.user.avatar,
          count: 1
        };
      }
      return acc;
    }, {});
    this.props.setUserPosts(userPosts);
  };

  displayMessagesSkeleton = loading =>
    loading ? [...Array(9)].map(num => <Skeleton key={num} />) : null;

  displayMessages = messages =>
    messages.length > 0 &&
    messages.map(message => (
      <Message
        key={message.timestamp}
        message={message}
        user={this.state.user}
      />
    ));

  displayChannelName = channel => {
    return channel
      ? `${this.state.privateChannel ? '@' : '#'}${channel.name}`
      : '';
  };

  displayTypingUsers = typingUsers =>
    typingUsers.length > 0 &&
    typingUsers.map(({ id, name }) => (
      <div
        key={id}
        style={{ display: 'flex', alignItems: 'center', marginBottom: '0.2em' }}
      >
        <span className='user__typing'>{name} is typing</span>
        <Typing />
      </div>
    ));

  render() {
    // prettier-ignore
    const { messagesRef, messages, channel, messagesLoading, user, typingUsers, numUniqueUsers, searchTerm, searchResults, searchLoading, privateChannel, isChannelStarred } = this.state;

    return (
      <React.Fragment>
        <MessagesHeader
          channelName={this.displayChannelName(channel)}
          numUniqueUsers={numUniqueUsers}
          handleSearchChange={this.handleSearchChange}
          searchLoading={searchLoading}
          isPrivateChannel={privateChannel}
          handleStar={this.handleStar}
          isChannelStarred={isChannelStarred}
        />

        <Segment>
          <Comment.Group className='messages'>
            {this.displayMessagesSkeleton(messagesLoading)}
            {searchTerm
              ? this.displayMessages(searchResults)
              : this.displayMessages(messages)}
            {this.displayTypingUsers(typingUsers)}
            <div ref={node => (this.messageEnd = node)} />
          </Comment.Group>
        </Segment>

        <MessageForm
          messagesRef={messagesRef}
          currentChannel={channel}
          currentUser={user}
          isPrivateChannel={privateChannel}
          getMessagesRef={this.getMessagesRef}
        />
      </React.Fragment>
    );
  }
}

export default connect(
  null,
  { setUserPosts }
)(Messages);
