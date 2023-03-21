import Swal from 'sweetalert2';

export default function ClearTable({ table: string }) {

    async function clearTable() {
        let choice = Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, clear it!'
        })

        if (!choice) return;

        console.log('clear');
        // const response = await fetch('/api/database/clear', {
        //     method: 'DELETE',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         table: table
        //     })
        // });
    }

    return (
        <div>
            <button className="btn btn-danger" onClick={clearTable}>{`Clear #${table}`}</button>
        </div>
    );
}