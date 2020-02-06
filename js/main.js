

/* ========================
  Variables
======================== */

const FIREBASE_AUTH = firebase.auth();
const FIREBASE_MESSAGING = firebase.messaging();
const FIREBASE_DATABASE = firebase.database();

const signInButton = document.getElementById("sign-in");
const signOutButton = document.getElementById("sign-out");
const subscribeButton = document.getElementById("subscribe");
const unsubscribeButton = document.getElementById("unsubscribe");
const sendNotificationForm = document.getElementById("send-notification-form");
const formDiv = document.getElementById("form-div");

/* ========================
  Event Listeners
======================== */

signInButton.addEventListener('click', signIn);
signOutButton.addEventListener('click', signOut);
subscribeButton.addEventListener('click', subscribeToNotifications);
unsubscribeButton.addEventListener('click', unsubscribeFromNotifications);
sendNotificationForm.addEventListener('submit',sendNotification);

FIREBASE_AUTH.onAuthStateChanged(handleAuthSateChanged);
FIREBASE_MESSAGING.onTokenRefresh(handleTokenRefresh);


/* ========================
  Functions
======================== */
function signIn() {
  
  FIREBASE_AUTH.signInWithPopup(new firebase.auth.GoogleAuthProvider() );
}

function signOut() {
  FIREBASE_AUTH.signOut();
}

function handleAuthSateChanged(user) {
  console.log("Checking user logged in");
  if (user) {
    console.log(user);
    signInButton.setAttribute("hidden",true);
    signOutButton.removeAttribute("hidden");
    formDiv.removeAttribute("hidden");

    checkSubscription();
  } else {
    console.log("no user");
    signInButton.removeAttribute("hidden");
    signOutButton.setAttribute("hidden",true);
    formDiv.setAttribute("hidden",true);
    subscribeButton.setAttribute("hidden",true);
    unsubscribeButton.setAttribute("hidden",true);
  }
}

function subscribeToNotifications() {
  FIREBASE_MESSAGING.requestPermission()
    .then(() => handleTokenRefresh())
    .then(() => checkSubscription())
    .catch((err) => {
      console.log("User didn't give permission :(")
    });
}






function handleTokenRefresh() {
  return FIREBASE_MESSAGING.getToken()
    .then((token) => {
      FIREBASE_DATABASE.ref('/tokens').push({
        token: token,
        uid: FIREBASE_AUTH.currentUser.uid
      });
    });
    
}

let snapCheck = null;
function unsubscribeFromNotifications() {
  let tokenToRemove = null;
  FIREBASE_MESSAGING.getToken()
    .then((token) => {
      tokenToRemove = token;
      return FIREBASE_MESSAGING.deleteToken(token)
      }
      )
    .then(() => FIREBASE_DATABASE.ref('/tokens').orderByChild('token').equalTo(tokenToRemove)
    .once('value'))
    .then((snapshot) => {
      snapCheck = snapshot;
      console.log("We want to remove this token: ", tokenToRemove);
      console.log(snapshot.val());
      const key = Object.keys(snapshot.val())[0];
      return FIREBASE_DATABASE.ref('/tokens').child(key).remove();

    })
    .then(() => checkSubscription())
    .catch(() => console.log("Unsubscribe failed"));
}

function checkSubscription() {
  FIREBASE_MESSAGING.getToken()
  .then((token) => {
    console.log("This Device Token:",token);
    return FIREBASE_DATABASE.ref('/tokens').orderByChild('token').equalTo(token).once('value')
    .then((snapshot) => {
      if ( snapshot.val()) {
        unsubscribeButton.removeAttribute("hidden");
        subscribeButton.setAttribute("hidden",true);
      } else {
        subscribeButton.removeAttribute("hidden");
        unsubscribeButton.setAttribute("hidden",true);
      }
    })
  })
 
  
}

function sendNotification(e) {
  e.preventDefault();

  const notificationMessage = document.getElementById('notification-message').value;

  FIREBASE_DATABASE.ref('/notifications').push({
    user: FIREBASE_AUTH.currentUser.displayName,
    message: notificationMessage,
    userProfileImg: FIREBASE_AUTH.currentUser.photoURL
  }).then(() => {
    document.getElementById('notification-message').value = '';
  })
}



FIREBASE_MESSAGING.onMessage((payload) => {
  console.log("onMessage:",payload);
});


