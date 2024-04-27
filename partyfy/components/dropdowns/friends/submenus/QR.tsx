import { FaCopy, FaPaperPlane } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { UserProfile } from '@auth0/nextjs-auth0/client';
import { getUserID } from '@/helpers/Utils';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import Loading from '@/components/misc/Loading';
import QRCode from "react-qr-code";
import { FriendListScreen } from '@/helpers/FriendListScreen';
import e from 'express';

const QR = ({ user, setIsComponentVisible, setFriendsListScreen } : { user : UserProfile, setIsComponentVisible: Function, setFriendsListScreen: Function } ) => {
    const [loading, setLoading] = useState(true);
    const [qrCodeURL, setQRCodeURL] = useState('');
    const [expirationDate, setExpirationDate] = useState<Date>(null);

    async function getNewSession() {

        function toLocalISOString(date) {
            const offset = date.getTimezoneOffset() * 60000; // Convert offset to milliseconds
            const localISOTime = new Date(date - offset).toISOString();
            return localISOTime.slice(0, 16);
        }
        
        const now = new Date();
        const oneWeekLater = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // One week from now
        
        const currentDateTime = toLocalISOString(now);
        const maxDateTime = toLocalISOString(oneWeekLater);
        
        const expirationDate = await Swal.fire({
            title: 'Expiration Date',
            text: 'Choose an expiration date for this session. After this date, the session will be deleted. The expiration date cannot be changed. The maximum length is one week.',
            input: 'datetime-local',
            inputAttributes: {
                min: currentDateTime, // Prevent past dates
                max: maxDateTime,     // One week limit
            },
            showCancelButton: true,
            confirmButtonText: 'Create',
            cancelButtonText: 'Cancel'
        })

        if (expirationDate.isDismissed) return;
        let date = new Date(expirationDate.value);
        if (date < new Date()) {
            Swal.fire({
                title: 'Invalid Date',
                text: 'The expiration date must be in the future.',
                icon: 'error'
            })
            return;
        }

        const response = await fetch('/api/database/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UserID: getUserID(user),
                ExpirationDate: date
            })
        })
        const data = await response.json();
        if (data.name === 'Error creating session') {
            Swal.fire({
                title: 'Error',
                text: 'There was an error creating a session. Please try again later.',
                icon: 'error'
            })
        }
        setExpirationDate(new Date(data.expiration_date));
        setQRCodeURL("https://partyfy.mattvandenberg.com?session=" + data.session_id);
        setIsComponentVisible(true);
        setFriendsListScreen(FriendListScreen.QR);
    }

    async function deleteSession(withConfirmation = true) {
        if (withConfirmation) {
            const choice = Swal.fire({
                title: 'Are you sure?',
                text: 'This will delete the session immediately and the QR code will no longer be valid. You can\'t undo this action!',
                icon: 'warning',
                showCancelButton: true
            })
            if ((await choice).isDismissed) return;
        }
        const response = await fetch('/api/database/sessions', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UserID: getUserID(user)
            })
        })
        const data = await response.json();
        // if (data.name === 'Error deleting session') {
        //     Swal.fire({
        //         title: 'Error',
        //         text: 'There was an error deleting the session. Please try again later.',
        //         icon: 'error'
        //     })
        // }
        setQRCodeURL('');
        setIsComponentVisible(true);
        setFriendsListScreen(FriendListScreen.QR);
    }

    useEffect(() => {
        fetch('/api/database/sessions?UserID=' + getUserID(user))
        .then(res => res.json())
        .then(data => {
            if (data === null) {
                setQRCodeURL('');
            } else {
                setExpirationDate(new Date(data.expiration_date));
                setQRCodeURL("https://partyfy.mattvandenberg.com?session=" + data.session_id);
            }
            setLoading(false);
        })
        .catch(err => {
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        async function checkSessionExpiration() {
            if (expirationDate && expirationDate < new Date()) {
                await deleteSession(false);
            }
        }
        // Check if the session has expired every 5 seconds
        checkSessionExpiration();
        const interval = setInterval(checkSessionExpiration, 5000);

        return () => clearInterval(interval);
    }, [qrCodeURL, expirationDate])

    if (loading) return <Loading />

    function copyLinkToClipboard(): void {
        navigator.clipboard.writeText(qrCodeURL);
        Swal.fire({
            title: 'Copied to Clipboard',
            text: 'The link has been copied to your clipboard.',
            icon: 'success'
        })
    }

    return (
        <div>
            <h1 className='my-3'>QR (Beta)</h1>
            {
                qrCodeURL 
                ?
                <div className='w-full text-center flex flex-col place-items-center gap-4'>
                    <h4 className='mt-3'>Your friends can scan this code to join your temporary session.</h4>
                    <h4>Session expires on {expirationDate.toLocaleDateString()} at {expirationDate.toLocaleTimeString()}</h4>
                    <QRCode value={qrCodeURL} />
                    <button className='btn btn-secondary' onClick={() => copyLinkToClipboard()}><FaCopy className='mr-2' /> Copy link to clipboard</button>
                    <button className='btn btn-error' onClick={() => deleteSession(true)}>Delete Session</button>
                </div>
                :
                <div>
                    <div className='w-full flex flex-col place-items-center gap-6'>
                        <h4 className='text-xl text-center mt-3'>You can now generate a temporary session, which allows friends to join from a QR Code without a Partyfy or Spotify account. Generate a new session?</h4>
                        <button className='btn btn-primary' onClick={getNewSession}>Generate</button>
                    </div>
                    {
                        loading && <Loading />
                    }
                </div>
            }
        </div>
    )
}

export default QR;