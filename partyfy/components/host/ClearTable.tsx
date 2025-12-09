import UserContext from '@/providers/UserContext';
import { useContext } from 'react';
import { useAlert } from '@/hooks/useAlert';
import { Button } from '@/components/ui/button';

const ClearTable = ({ table } : { table: string }) => {

    const alert = useAlert();
    const { user } = useContext(UserContext);

    async function clearTable() {
        let choice = await alert.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, clear it!'
        });

        if (choice.isConfirmed) {
            const response = await fetch('/api/database/recents', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    OwnerUserID: user.getUserID(),
                })
            });

            if (response.status === 200) {
                await alert.fire({
                    title: 'Cleared!',
                    text: 'The table has been cleared.',
                    icon: 'success'
                });
            }
        }
    }

    return (
        <>
            <Button variant="destructive" className="m-2" onClick={clearTable}>{`Clear ${table}`}</Button>
            <alert.AlertComponent />
        </>
    );
}

export default ClearTable;