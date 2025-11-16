import Loading from '@/components/misc/Loading';
import { FriendListScreen } from '@/helpers/FriendListScreen';
import PartyfyUser from '@/helpers/PartyfyUser';
import { useEffect, useRef, useState } from 'react';
import { FaCopy, FaPlus, FaSave, FaTrash } from 'react-icons/fa';
import QRCode from "react-qr-code";
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const QR = ({ user, setFriendsListScreen } : { user : PartyfyUser, setFriendsListScreen: Function } ) => {
    const [loading, setLoading] = useState(true);
    const [qrCodeURL, setQRCodeURL] = useState('');
    const [expirationDate, setExpirationDate] = useState<Date>(null);

    const qrRef = useRef(null);

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
                UserID: user.getUserID(),
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
                UserID: user.getUserID()
            })
        })
        const data = await response.json();
        setQRCodeURL('');
        setFriendsListScreen(FriendListScreen.QR);
    }

    useEffect(() => {
        fetch('/api/database/sessions?UserID=' + user.getUserID())
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

    function copyLinkToClipboard(): void {
        navigator.clipboard.writeText(qrCodeURL);
        Swal.fire({
            title: 'Copied to Clipboard',
            text: 'The link has been copied to your clipboard.',
            icon: 'success'
        })
    }

    function saveQR() {
        // Create an XML serializer
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(qrRef.current);
      
        // Create a data URL
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
      
        // Create an image element
        const image = new Image();
        image.onload = () => {
          // Create a canvas and draw the image on it
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0);
      
          // Create a data URL from the canvas
          const imageURL = canvas.toDataURL('image/png');
      
          // Create a download link and click it programmatically
          const downloadLink = document.createElement('a');
          downloadLink.href = imageURL;
          downloadLink.download = 'downloaded-image.png';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
      
          // Revoke the object URL
          URL.revokeObjectURL(url);

          Swal.fire({
            title: 'Saved',
            text: 'The QR code has been saved successfully.',
            icon: 'success'
          })
        };
        image.src = url;
      };

    return (
        <div className='text-white'>
            <style>
                {`
                    .swal2-input {
                        display: block;
                        margin: 0 auto;
                        width: 70%; /* Adjust the width as needed */
                        text-align: center;
                        margin-top: 16px;
                    }
                `}
            </style>
            <h1 className='my-3 text-xl font-semibold'>QR Code</h1>
            {
                loading
                ?
                <Loading />
                :
                <>
                    {
                        qrCodeURL
                        ?
                        <div className='w-full h-full text-center flex flex-col place-items-center justify-start gap-4'>
                            <h4 className='mt-3 text-white'>Ask your friends to scan this code to join your temporary session.</h4>
                            <h4 className='text-stone-400'><i>Session expires on {expirationDate.toLocaleDateString()} at {expirationDate.toLocaleTimeString()}</i></h4>
                            <div className='w-auto p-2 border-white border-4 rounded-md'>
                                <QRCode bgColor='transparent' fgColor='white' ref={qrRef} value={qrCodeURL} size={192} />
                            </div>
                            <div className='flex gap-2'>
                                <Button variant='secondary' onClick={() => saveQR()}><FaSave /></Button>
                                <Button variant='secondary' onClick={() => copyLinkToClipboard()}><FaCopy /></Button>
                                <Button variant="destructive" onClick={() => deleteSession(true)}><FaTrash /></Button>
                            </div>
                        </div>
                        :
                        <div>
                            <div className='w-full flex flex-col place-items-center gap-6'>
                                <h4 className='text-md text-center mt-3 text-white'>You can create a temporary session, which allows friends to join from a QR Code without a Partyfy or Spotify account.</h4>
                                <Button variant='secondary' onClick={getNewSession}><FaPlus className="mr-2" /> Create Session</Button>
                            </div>
                            {
                                loading && <Loading />
                            }
                        </div>
                    }
                </>

            }
        </div>
    )
}

export default QR;