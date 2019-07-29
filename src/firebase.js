import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/storage';

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: 'AIzaSyDtIy04UMBAiAYBX1iRejBBU7iaL3Wu94Q',
  authDomain: 'slack-clone-a1d0a.firebaseapp.com',
  databaseURL: 'https://slack-clone-a1d0a.firebaseio.com',
  projectId: 'slack-clone-a1d0a',
  storageBucket: 'slack-clone-a1d0a.appspot.com',
  messagingSenderId: '921319807986',
  appId: '1:921319807986:web:2c287c2e7f26f688'
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export default firebase;
