import Swal from 'sweetalert2/dist/sweetalert2.js';

function onClose() {
    console.log("Closed");
}

function toggleRateLimiting() {
    var isEnabled = (document.getElementById('enforceRateLimiting') as HTMLInputElement).checked;
    (document.getElementById('numSongs') as HTMLInputElement).disabled = !isEnabled;
    (document.getElementById('limit') as HTMLInputElement).disabled = !isEnabled;
    (document.getElementById('timespan') as HTMLInputElement).disabled = !isEnabled;
}

const tsx = `
<div class="text-xl p-4">
    <h3>1. Rate Limiting</h3>
    <div class="card p-3 w-full text-left">
        <label class="label cursor-pointer">
            <span class="label-text">Enforce rate limiting</span> 
            <input type="checkbox" id="enforceRateLimiting" class="toggle toggle-primary" onchange="toggleRateLimiting()">
        </label>
        <div class="flex flex-col justify-left gap-3 mb-4">
            <input id="numSongs" type="number" placeholder="#" class="input input-bordered input-primary w-full max-w-xs" disabled />
            <span>songs can be queued every</span>
            <input id="limit" type="number" placeholder="#" class="input input-bordered input-primary w-full max-w-xs" disabled />
            <select id="timespan" class="select select-bordered w-full max-w-xs" disabled>
                <option>Seconds</option>
                <option>Minutes</option>
                <option>Hours</option>
                <option>Days</option>
                <option>Weeks</option>
                <option>Months</option>
            </select>
        </div>
    </div>
</div>
`;



export default async function showCommercialOptions() {
    let { value: options } = await Swal.fire({
        "title": "Commercial Options",
        "html": tsx,
        "showCloseButton": true,
        "showCancelButton": true,
        "focusConfirm": false,
        "confirmButtonText": "Close",
        preConfirm: () => {
            return {
                "numSongs": (document.getElementById("numSongs") as HTMLInputElement).value,
                "limit": (document.getElementById("limit") as HTMLInputElement).value,
                "timespan": (document.getElementById("timespan") as HTMLInputElement).value
            }
        }
    });

    if (options) {
        console.log(options);
    } 
} 