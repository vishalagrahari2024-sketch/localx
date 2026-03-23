const axios = require('axios');
const admin = require('firebase-admin');

(async () => {
  try {
    // 1. Initialize Firebase Admin
    const serviceAccount = require('./serviceAccountKey.json');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    // 2. Create a custom token
    const customToken = await admin.auth().createCustomToken('test_user_uid');
    
    // We can't easily exchange custom token for ID token via Admin SDK.
    // Let's just create a mock user in MongoDB directly, or mock the auth middleware.
  } catch (err) {
    console.error(err);
  }
})();
