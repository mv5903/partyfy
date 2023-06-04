import { useContext } from 'react';
import Swal from 'sweetalert2';
import UserContext from '@/providers/UserContext';

const ClearTable = ({ table } : { table: string }) => {

    const {
        spotifyAuth,
        user
    } = useContext(UserContext);

    async function clearTable() {
        let choice = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, clear it!'
        })

        if (choice.isConfirmed) {
            const response = await fetch('/api/database/recents', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    OwnerUserID: user.sub ?? user.user_id
                })
            });

            if (response.status === 200) {
                Swal.fire(
                    'Cleared!',
                    'The table has been cleared.',
                    'success'
                )
            }
        }
    }

    return (
        <>
            <button className="btn btn-danger m-2" onClick={clearTable}>{`Clear ${table}`}</button>
        </>
    );
}

export default ClearTable;