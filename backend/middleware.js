
const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json'); 

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; 
    
    if (!token) {
        return res.status(401).json({ message: 'Authorization token missing' });
    }

    try {
     
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        req.user = decodedToken; 
        next(); 
        
    } catch (error) {
        console.error('Error verifying token:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;