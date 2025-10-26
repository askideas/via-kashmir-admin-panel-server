const admin = require('firebase-admin');

let db = null;

const initializeFirebase = () => {
    try {
        // Initialize Firebase Admin SDK
        if (!admin.apps.length) {
            // For production, use service account key file
            if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    projectId: process.env.FIREBASE_PROJECT_ID
                });
            } else {
                // For development, use service account key JSON
                const serviceAccount = {
                    type: "service_account",
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    client_id: process.env.FIREBASE_CLIENT_ID,
                    auth_uri: "https://accounts.google.com/o/oauth2/auth",
                    token_uri: "https://oauth2.googleapis.com/token",
                    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
                };

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: process.env.FIREBASE_PROJECT_ID
                });
            }
        }

        // Initialize Firestore
        db = admin.firestore();
        
        console.log('✅ Firebase Admin SDK initialized successfully');
        console.log(`🔥 Connected to Firestore project: ${process.env.FIREBASE_PROJECT_ID}`);
        
    } catch (error) {
        console.error('❌ Error initializing Firebase:', error.message);
        throw new Error('Failed to initialize Firebase Admin SDK');
    }
};

const getFirestore = () => {
    if (!db) {
        throw new Error('Firestore is not initialized. Call initializeFirebase() first.');
    }
    return db;
};

module.exports = {
    initializeFirebase,
    getFirestore,
    admin
};