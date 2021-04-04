import { firebase } from '@firebase/app';
require('@firebase/firestore')

var firebaseConfig = {
  apiKey: "AIzaSyBzXX3dzxFw49yiZQC1BXj45-rsKF1ch-4",
  authDomain: "willy-5e02f.firebaseapp.com",
  projectId: "willy-5e02f",
  storageBucket: "willy-5e02f.appspot.com",
  messagingSenderId: "97176037386",
  appId: "1:97176037386:web:1aaa2b682b2704a2b797f3"
};
firebase.initializeApp(firebaseConfig);

export default firebase.firestore();