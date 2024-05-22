export function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

export function generateUniqueIdentifier() {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, function() {
        const r = Math.random() * 16 | 0;
        return r.toString(16);
    });
}

export function getDeviceIdentifier() {
    let deviceId = getCookie('device_id') || localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = generateUniqueIdentifier();
        setCookie('device_id', deviceId, 365);
        localStorage.setItem('device_id', deviceId);
    } else {
        // Ensure consistency between storage and cookie
        if (!getCookie('device_id')) {
            setCookie('device_id', deviceId, 365);
        }
        if (!localStorage.getItem('device_id')) {
            localStorage.setItem('device_id', deviceId);
        }
    }
    return deviceId;
}
