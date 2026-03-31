import axios from 'axios';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const subscribeUserToPush = async (token) => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            // Check for existing permission
            let permission = Notification.permission;
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }
            if (permission !== 'granted') {
                console.warn('Push notification permission not granted:', permission);
                return;
            }

            // Register Service Worker
            const register = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            console.log('Service Worker Registered');

            // Get VAPID public key from backend
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/vapidPublicKey`);
            const publicVapidKey = data.publicKey;
            const serverKeyUint8 = urlBase64ToUint8Array(publicVapidKey);

            // Check if already subscribed
            const existingSubscription = await register.pushManager.getSubscription();
            
            if (existingSubscription) {
                // Check if the current subscription matches the server's public key
                const currentKey = new Uint8Array(existingSubscription.options.applicationServerKey);
                const isMatch = currentKey.length === serverKeyUint8.length && 
                               currentKey.every((val, index) => val === serverKeyUint8[index]);

                if (isMatch) {
                    console.log('User already has a valid push subscription.');
                    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/subscribe`, existingSubscription, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    return;
                } else {
                    console.log('VAPID key mismatch detected. Re-subscribing...');
                    await existingSubscription.unsubscribe();
                }
            }

            // Subscribe to Push Service
            const subscription = await register.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: serverKeyUint8
            });

            // Send Subscription to Backend
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/subscribe`, subscription, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Push notification subscribed successfully with new VAPID keys!');
        } catch (error) {
            console.error('Error subscribing to web push:', error);
        }
    } else {
        console.error('Service Worker or Push Manager not supported in this browser.');
    }
};
