import ClearTable from './ClearTable';
import styles from '../styles/Options.module.css';
import { useState } from 'react';

const Options = () => {
    const [showOptions, setShowOptions] = useState(false);

    function unattendedQueues() {
        
    }

    return (
        <>
            <button className="btn btn-primary" onClick={() => setShowOptions(true)}>Options</button>
            {
                showOptions &&
                <div className={styles.options}>
                    <div>
                        <h3>Options</h3>
                        <div className="d-flex">
                            <ClearTable table={'Queue'} />  
                            <ClearTable table={'Recently Played'} />
                        </div>
                        <button className="btn btn-warning m-2" onClick={() => unattendedQueues()}>Allow Unattended Queues</button>
                    </div>
                </div>
            }
        </>
    )
}

export default Options;