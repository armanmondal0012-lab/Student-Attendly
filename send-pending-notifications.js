const { initializeApp, applicationDefault, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

const projectId = 'attendly-app-aa831';
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error('Missing GitHub Actions secret FIREBASE_SERVICE_ACCOUNT_JSON');
const serviceAccount = JSON.parse(raw);
if (!getApps().length) initializeApp({ credential: cert(serviceAccount), projectId });
const db = getFirestore();
const messaging = getMessaging();
const INVALID = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token'
]);

async function sendOne(notificationDoc) {
  const data = notificationDoc.data() || {};
  const title = String(data.title || 'Attendly').slice(0, 100);
  const body = String(data.body || 'New update from Admin').slice(0, 500);
  const users = await db.collection('users').get();
  const refs = [];
  for (const user of users.docs) {
    const snap = await user.ref.collection('fcmTokens').get();
    for (const tokenDoc of snap.docs) {
      const token = tokenDoc.get('token');
      if (typeof token === 'string' && token.length > 20) refs.push({ ref: tokenDoc.ref, token });
    }
  }
  let successCount = 0;
  let failureCount = 0;
  for (let i = 0; i < refs.length; i += 500) {
    const group = refs.slice(i, i + 500);
    const result = await messaging.sendEachForMulticast({
      tokens: group.map(x => x.token),
      notification: { title, body },
      data: { url: '/' },
      webpush: { fcmOptions: { link: '/' }, notification: { icon: '/favicon.ico' } }
    });
    successCount += result.successCount;
    failureCount += result.failureCount;
    const batch = db.batch();
    let removed = 0;
    result.responses.forEach((response, index) => {
      const code = response.error && response.error.code;
      if (!response.success && INVALID.has(code)) { batch.delete(group[index].ref); removed++; }
    });
    if (removed) await batch.commit();
  }
  await notificationDoc.ref.update({
    sent: true,
    successCount,
    failureCount,
    tokenCount: refs.length,
    sentAt: FieldValue.serverTimestamp(),
    deliveryMethod: 'github-actions'
  });
  console.log(`Sent ${notificationDoc.id}: ${successCount} success, ${failureCount} failed, ${refs.length} tokens`);
}

(async () => {
  const pending = await db.collection('notifications').where('sent', '==', false).limit(20).get();
  if (pending.empty) { console.log('No pending Attendly notifications.'); return; }
  for (const doc of pending.docs) {
    try { await sendOne(doc); }
    catch (error) {
      console.error(`Failed notification ${doc.id}:`, error);
      await doc.ref.update({ lastError: String(error.message || error).slice(0, 500), lastAttemptAt: FieldValue.serverTimestamp() });
      process.exitCode = 1;
    }
  }
})().catch(error => { console.error(error); process.exit(1); });
