export function fetchState() {
    if (!(window.firebase && firebase.database)) return Promise.resolve(null);
    const DEVICE_ID = window.DMX_DEVICE_ID || '290688576796';
    const dbRef = firebase.database().ref(`devices/${DEVICE_ID}/last_command`);
    return dbRef.once('value').then(snap => {
        const data = snap.val();
        return data || null;
    }).catch(err => {
        console.error('Failed to fetch Firebase state', err);
        return null;
    });
}

export function setState(data) {
    if (window.firebase && firebase.database) {
        try {
            const DEVICE_ID = window.DMX_DEVICE_ID || '290688576796';
            const dbRef = firebase.database().ref(`devices/${DEVICE_ID}/last_command`);
            dbRef.set(data).catch(err => console.error('Firebase write failed', err));
            return;
        } catch (e) {
            console.error('Firebase write error', e);
        }
    }
}
