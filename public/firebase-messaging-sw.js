importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyARY5ZIykjn6Nd9GphGDbyAmXwHWZBdlJQ", 
  authDomain: "dollarshop-304a0.firebaseapp.com", 
  projectId: "dollarshop-304a0", 
  storageBucket: "dollarshop-304a0.firebasestorage.app", 
  messagingSenderId: "990077363444", 
  appId: "1:990077363444:web:693d486f38db3ec096eaa1" 
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
