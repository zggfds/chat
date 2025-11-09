// Скопируй свой config из консоли Firebase сюда!
const firebaseConfig = {
  apiKey: "AIzaSyBHdKrdDkUbBzkNbZOBH1BZNtGa34PipZU",
  authDomain: "nova-3b717.firebaseapp.com",
  databaseURL: "https://nova-3b717-default-rtdb.firebaseio.com",
  projectId: "nova-3b717",
  storageBucket: "nova-3b717.appspot.com",
  messagingSenderId: "156737641623",
  appId: "1:156737641623:web:0e5295b428a8fbdfec5dd2"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
