import { BsFillPersonFill } from 'react-icons/bs';
import { IoMdArrowDropdown } from 'react-icons/io';
import { isMobile } from 'react-device-detect';

import Options from '@/components/host/Options';
import useComponentVisible from '@/hooks/useComponentVisible';

import styles from '@/styles/Options.module.css';
import { UserProfile } from '@auth0/nextjs-auth0/client';
import { getUserID } from '@/helpers/Utils';
import Swal from 'sweetalert2';

const UserQuickAction = ({ user, isAHost, setIsAHost } : { user: UserProfile, isAHost: boolean, setIsAHost: Function }) =>  {

    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(true);

    const deleteAccount = async () => {
        let confirmation = await Swal.fire({
            title: 'Are you sure?',
            text: "This action CANNOT be undone!",
            icon: 'warning',
            showCancelButton: true
        })
        if (confirmation.isConfirmed) {
            const res = await fetch('/api/database/users?UserID=' + getUserID(user), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                window.location.href = '/api/auth/logout';
            }
        }
    }

    const unlinkSpotify = async () => {
        let confirmation = await Swal.fire({
            title: 'Are you sure you want to unlink your Spotify Account?',
            text: "This action CANNOT be undone!",
            icon: 'warning',
            showCancelButton: true
        })
        if (confirmation.isConfirmed) {
            const res = await fetch('/api/database/users?action=unlink&UserID=' + getUserID(user), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            window.location.href = '/api/auth/logout';
        }
    }

    return (
        <div ref={ref}>
            <div className={`flex align-center me-2 cursor-pointer ${isComponentVisible ? 'bg-secondary' : 'bg-gray-800'} p-1 rounded mt-2 ${styles.quickMenu}`} onClick={() => setIsComponentVisible(!isComponentVisible)}>
                <BsFillPersonFill size={40} />
                <IoMdArrowDropdown className='mt-2' size={25} />
            </div>
            {
                isComponentVisible &&
                <div className={styles.actionMenu}>
                    {
                        !isMobile && isAHost &&
                        <Options />
                    }
                    {
                        !isMobile && isAHost != null &&
                        <button className="btn btn-primary" onClick={() => { setIsComponentVisible(!isComponentVisible); setIsAHost(null); }}>Return to Mode Selection</button>
                    }
                    <button className="btn btn-error" onClick={() => deleteAccount()}>Delete my account</button>
                    <button className="btn btn-warning" onClick={() => unlinkSpotify()}>Unlink Spotify</button>
                    <a href="/api/auth/logout" className="btn btn-primary" onClick={() => setIsComponentVisible(!isComponentVisible)}>Log Out</a>
                </div>
            }
        </div>
    )
}

export default UserQuickAction;