const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });




exports.sendNotifications= functions.database.ref('/notifications/{notificationsId}')
.onCreate((snapshot,context)=>{
    const notification=context.params.notificationsId;
    console.log("Came in");
    console.info(`New Message ${notification}`);
    const original = snapshot.val();
    console.log(original);
    const payload={
        notification:{
            title:`New Message from ${original.user}`,
            body:original.message,
            icon:original.userProfileImg,
            click_action:'https://simply-notify-c4182.firebaseapp.com/'
        }
    };
    console.info(payload);

    return admin.database().ref('/tokens').once('value').then((data) => {
        if ( !data.val() ) return;
        const snapshot = data.val();
        const tokens = [];

        for (let key in snapshot) {
            tokens.push(snapshot[key].token);
        }
        
        return admin.messaging().sendToDevice(tokens, payload)
        .then((response) => {
            console.info(response.results);
        });

    });

});