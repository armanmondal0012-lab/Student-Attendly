/* Deploy at the website root as /firebase-messaging-sw.js.
   Firebase project settings must match the app HTML. */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: 'AIzaSyBdybdbioTQj_Np9Bw4pDWwe8E0iZjowWU',
  authDomain: 'attendly-app-aa831.firebaseapp.com',
  projectId: 'attendly-app-aa831',
  storageBucket: 'attendly-app-aa831.firebasestorage.app',
  messagingSenderId: '680540068613',
  appId: '1:680540068613:web:59223d50df1786873c356c',
  measurementId: 'G-FHNH3TPYWK'
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  const title = (payload.notification && payload.notification.title) || 'Attendly';
  self.registration.showNotification(title, {
    body: (payload.notification && payload.notification.body) || 'You have a new update.',
    icon: '/favicon.ico',
    data: payload.data || {}
  });
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
    for (const client of list) if ('focus' in client) return client.focus();
    if (clients.openWindow) return clients.openWindow('/');
  }));
});
