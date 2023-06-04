import Options from '@/components/Options';
import styles from '../styles/Options.module.css';
import { BsFillPersonFill } from 'react-icons/bs';
import { IoMdArrowDropdown } from 'react-icons/io';
import { isMobile } from 'react-device-detect';
import useComponentVisible from '@/hooks/useComponentVisible';

const UserQuickAction = ({ isAHost, setIsAHost } : { isAHost: boolean, setIsAHost: Function }) =>  {

    const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(true);

    return (
        <div className='mt-4' ref={ref}>
            <div className={`d-flex flex-row align-items-center me-2 mt-2 ${styles.quickMenu}`} onClick={() => setIsComponentVisible(!isComponentVisible)}>
                <BsFillPersonFill size={40} />
                <IoMdArrowDropdown size={25} />
            </div>
            {
                isComponentVisible &&
                <div style={{ top: isMobile ? '7vh' : '4vh' }} className={styles.actionMenu}>
                    {
                        !isMobile && isAHost &&
                        <Options />
                    }
                    {
                        !isMobile && isAHost != null &&
                        <button className="btn btn-primary" onClick={() => { setIsComponentVisible(!isComponentVisible); setIsAHost(null); }}>Return to Mode Selection</button>
                    }
                    <a href="/api/auth/logout" className="btn btn-primary" onClick={() => setIsComponentVisible(!isComponentVisible)}>Log Out</a>
                </div>
            }
        </div>
    )
}

export default UserQuickAction;