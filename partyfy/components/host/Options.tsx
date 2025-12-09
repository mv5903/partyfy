import UserContext from '@/providers/UserContext';
import { useContext, useEffect, useState } from 'react';
import ClearTable from './ClearTable';
import { Button } from '@/components/ui/button';

const Options = () => {
    const { user } = useContext(UserContext);

    const [showOptions, setShowOptions] = useState(false);
    const [isUnattendedQueuesEnabled, setIsUnattendedQueuesEnabled] = useState(false);
    
    useEffect(() => {
        async function fn() {
            const response = await fetch('/api/database/unattendedqueues?UserID=' + user.getUserID());
            const data = await response.json();
            if (data) {
                setIsUnattendedQueuesEnabled(data.UnattendedQueues ?? false);
            }
        }

        fn();
    }, [user]);

    async function unattendedQueues() {
        const response = await fetch('/api/database/unattendedqueues', {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UserID: user.getUserID(),
                enable: !isUnattendedQueuesEnabled
            })
        });
        if (response.ok) {
            setIsUnattendedQueuesEnabled(!isUnattendedQueuesEnabled);
        }
    }

    return (
        <>
            <Button onClick={() => setShowOptions(true)}>Options</Button>
            {
                showOptions &&
                <div>
                    <div>
                        <h3>Options</h3>
                        <div className="d-flex">
                            <ClearTable table={'Queue'} />
                            <ClearTable table={'Recently Played'} />
                        </div>
                        <Button
                            variant={isUnattendedQueuesEnabled ? "success" : "warning"}
                            className="m-2"
                            onClick={() => unattendedQueues()}
                        >
                            {isUnattendedQueuesEnabled ? "Unattended Queues Enabled. Disable..." : "Allow Unattended Queues"}
                        </Button>
                    </div>
                </div>
            }
        </>
    )
}

export default Options;
