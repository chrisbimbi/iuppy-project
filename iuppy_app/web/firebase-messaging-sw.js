importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

firebase.initializeApp({
    apiKey: 'AIzaSyD-DU-6Mj6dHw16M9zyjearMLKrVVyrz4s',
    appId: '1:643342034012:web:a240360662660721d9f299',
    messagingSenderId: '643342034012',
    projectId: 'iuppy-app',
    authDomain: 'iuppy-app.firebaseapp.com',
    storageBucket: 'iuppy-app.firebasestorage.app',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/Icon-192.png'
    };

    self.registration.showNotification(notificationTitle,
        notificationOptions);
});
