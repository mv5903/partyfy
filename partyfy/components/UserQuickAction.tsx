import Options from '@/components/Options';
import styles from '../styles/Options.module.css';
import { useState } from 'react';
import { BsFillPersonFill } from 'react-icons/bs';
import { IoMdArrowDropdown } from 'react-icons/io';
import { isMobile } from 'react-device-detect';

const UserQuickAction = ({ isAHost, setIsAHost } : { isAHost: boolean, setIsAHost: Function }) =>  {

    const [ showQuickActionMenu, setShowQuickActionMenu ] = useState(false);

    function exitMenu() {
        setShowQuickActionMenu(false);
    }

    return (
        <>
        <div className={`d-flex flex-row align-items-center me-2 mt-2 ${styles.quickMenu}`} onClick={() => setShowQuickActionMenu(!showQuickActionMenu)}>
            <BsFillPersonFill size={40} />
            <IoMdArrowDropdown size={25} />
        </div>
        {
            showQuickActionMenu &&
            <div className={styles.actionMenu}>
                {
                    !isMobile && isAHost &&
                    <Options />
                }
                {
                    !isMobile &&
                    <button className="btn btn-primary" onClick={() => { exitMenu(); setIsAHost(null); }}>Return to Mode Selection</button>
                }
                <a href="/api/auth/logout" className="btn btn-primary" onClick={() => exitMenu()}>Log Out</a>
            </div>
        }
        </>
    )
}

export default UserQuickAction;