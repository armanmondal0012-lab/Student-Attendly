ATTENDLY PUSH NOTIFICATIONS — FIREBASE SPARK + GITHUB ACTIONS

This package keeps the existing Attendly app UI and uses GitHub Actions (not Cloud Functions) to send queued FCM notifications. The worker checks every 5 minutes, so delivery is not instantaneous.

IMPORTANT
- Never put a service-account JSON file in the repository or in the website.
- Add it only as a GitHub Actions secret named FIREBASE_SERVICE_ACCOUNT_JSON.
- The Firebase Web API key and public VAPID key in index.html/service worker are public client configuration; the service-account private key is secret.
- GitHub scheduled workflows can be delayed by GitHub; the next run may take longer than 5 minutes.
- GitHub Actions free usage is subject to GitHub account limits.

FIREBASE CONSOLE CHECKLIST
1. Project: attendly-app-aa831.
2. Authentication > Sign-in method: Email/Password enabled for Admin and Anonymous enabled for user devices.
3. Firestore Database exists.
4. Cloud Messaging > Web Push certificates: use the existing public VAPID key already embedded in the app.
5. Firestore Rules: publish the merged firestore.rules in this package. It preserves the current /attendly/shared rules and adds token/notification rules. Review before publishing.
6. Cloud Functions are NOT used; do not run firebase deploy --only functions and do not upgrade to Blaze for this GitHub Actions approach.

GITHUB SETUP
1. Create/open a GitHub repository and upload all files/folders from this package, including the hidden .github folder.
2. Firebase Console > Project settings > Service accounts > Generate new private key. Download the JSON privately.
3. In GitHub repository: Settings > Secrets and variables > Actions > New repository secret.
4. Secret name: FIREBASE_SERVICE_ACCOUNT_JSON. Secret value: paste the entire contents of the downloaded JSON file. Save.
5. Open Actions tab and enable workflows if GitHub asks.
6. Open "Attendly Push Notifications" workflow and choose Run workflow for a test run.
7. Deploy index.html and firebase-messaging-sw.js together at the website root on an HTTPS host. A local file:// page will not support web push reliably.
8. On every phone/browser, open the HTTPS app and tap the bell / Enable notifications. Allow permission. Each device must register its token.
9. Sign in as the authorized Admin, open Admin > Notifications, send a test. GitHub Actions will send queued items on its next run.

SECURITY
The GitHub service account can access project data through Admin SDK. Keep the secret private, restrict repository collaborators, and rotate the key if exposed. Never commit the JSON key.
