import Loading from '@/components/misc/Loading';
import { FriendListScreen } from '@/helpers/FriendListScreen';
import PartyfyUser from '@/helpers/PartyfyUser';
import { PartyfyProductType } from '@/helpers/PartyfyProductType';
import { useEffect, useRef, useState } from 'react';
import { FaCopy, FaPlus, FaSave, FaTrash } from 'react-icons/fa';
import QRCode from "react-qr-code";
import { useAlert } from '@/hooks/useAlert';
import { useNavigationLoader } from '@/hooks/useNavigationLoader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const QR = ({ user, setFriendsListScreen } : { user : PartyfyUser, setFriendsListScreen: Function } ) => {
    const alert = useAlert();
    const { startLoading, stopLoading } = useNavigationLoader();
    const [qrCodeURL, setQRCodeURL] = useState('');
    const [expirationDate, setExpirationDate] = useState<Date>(null);

    const qrRef = useRef(null);

    async function getNewSession() {
        let date: Date;

        // Check if user is commercial
        const isCommercial = user.getProductType() === PartyfyProductType.COMMERCIAL;

        if (isCommercial) {
            // Commercial users get sessions that don't expire
            // Use year 2200 - far enough to be effectively permanent, but safe for all systems
            date = new Date();
            date.setFullYear(2200, 11, 31); // December 31, 2200
            date.setHours(23, 59, 59, 999);
        } else {
            // Non-commercial users choose number of days (1-7)
            const daysResult = await alert.fire({
                title: 'Session Duration',
                text: 'How many days should this session last?',
                input: 'text',
                inputAttributes: {
                    type: 'number',
                    min: '1',
                    max: '7',
                    step: '1'
                } as any,
                inputValue: '7',
                showCancelButton: true,
                confirmButtonText: 'Create',
                cancelButtonText: 'Cancel',
                inputValidator: (value) => {
                    const num = parseInt(value);
                    if (!value || isNaN(num) || num < 1 || num > 7) {
                        return 'Please enter a number between 1 and 7';
                    }
                }
            });

            if (daysResult.isDismissed) return;

            const days = parseInt(daysResult.value);
            const now = new Date();
            date = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
        }

        startLoading();

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
        stopLoading();
        if (data.name === 'Error creating session') {
            await alert.fire({
                title: 'Error',
                text: 'There was an error creating a session. Please try again later.',
                icon: 'error'
            });
        } else {
            setExpirationDate(new Date(data.expiration_date));
            setQRCodeURL(`${window.location.origin}/request/@${user.db.Username}?session=${data.session_id}`);
            setFriendsListScreen(FriendListScreen.QR);
            await alert.fire({
                title: 'Session Created',
                text: 'Temporary session created successfully.',
                icon: 'success'
            });
        }
    }

    async function deleteSession(withConfirmation = true) {
        if (withConfirmation) {
            const choice = await alert.fire({
                title: 'Are you sure?',
                text: 'This will delete the session immediately and the QR code will no longer be valid. You can\'t undo this action!',
                icon: 'warning',
                showCancelButton: true
            })
            if (choice.isDismissed) return;
        }
        startLoading();
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
        stopLoading();
        setQRCodeURL('');
        setFriendsListScreen(FriendListScreen.QR);
    }

    useEffect(() => {
        startLoading();
        fetch('/api/database/sessions?UserID=' + user.getUserID())
        .then(res => res.json())
        .then(data => {
            if (data === null) {
                setQRCodeURL('');
            } else {
                setExpirationDate(new Date(data.expiration_date));
                setQRCodeURL(`${window.location.origin}/request/@${user.db.Username}?session=${data.session_id}`);
            }
            stopLoading();
        })
        .catch(err => {
            stopLoading();
        });
    }, [startLoading, stopLoading]);

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

    async function copyLinkToClipboard(): Promise<void> {
        navigator.clipboard.writeText(qrCodeURL);
        await alert.fire({
            title: 'Copied to Clipboard',
            text: 'The link has been copied to your clipboard.',
            icon: 'success'
        });
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

          alert.fire({
            title: 'Saved',
            text: 'The QR code has been saved successfully.',
            icon: 'success'
          });
        };
        image.src = url;
      };

    return (
        <div className='text-white'>
            {qrCodeURL
            ?
            <div className='w-full h-full text-center flex flex-col place-items-center justify-start gap-4'>
                            <h4 className='mt-3 text-white'>Ask your friends to scan this code to join your temporary session.</h4>
                            {
                                expirationDate.getFullYear() === 2200
                                ?
                                <h4 className='text-stone-400'><i>This session does not expire.</i></h4>
                                :
                                <h4 className='text-stone-400'><i>Session expires on {expirationDate.toLocaleDateString()} at {expirationDate.toLocaleTimeString()}</i></h4>
                            }
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
            <div className='w-full flex flex-col place-items-center gap-6'>
                <h4 className='text-md text-center mt-3 text-white'>You can create a temporary session, which allows friends to join from a QR Code without a Partyfy or Spotify account.</h4>
                <Button variant='secondary' onClick={getNewSession}><FaPlus className="mr-2" /> Create Session</Button>
            </div>
            }
            <alert.AlertComponent />
        </div>
    )
}

export default QR;