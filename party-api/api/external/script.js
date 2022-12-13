function clearTable(table) {
    console.info('Clearing table: ' + table)
    fetch('/controlpanel/clear?' + new URLSearchParams({
        table: table
    }))
    .then(response => response.json())
    .then(data => {
        window.location.reload();
    });
}

function fetchNowPlaying() {
    let currentSong = '';
    setInterval(() => {
        fetch('/controlpanel/getspotifylatest')
        .then(response => response.json())
        .then(data => {
            // Needed for when server just starts up to fetch access token
            if (data.error) {
                window.location.href = '/controlpanel';
            }
            document.getElementById('nowplayingtrack').innerHTML = data.item.name;
            document.getElementById('nowplayingartist').innerHTML = data.item.artists[0].name;
            let eicon = document.getElementById('title-e-icon');
            eicon.style.display = data.item.explicit ? 'block' : 'none';
            if (data.item.explicit) {
                eicon.setAttribute('width', '20px');
                eicon.setAttribute('height', '20px');
                eicon.style.backgroundColor = 'white';
            }
            document.getElementById('nowplayingalbum').setAttribute('src', data.item.album.images[1].url);
            // Update Now Playing item in database
            fetch('/controlpanel/updateNowPlaying?' + new URLSearchParams({
                id: data.item.id,
                albumart: data.item.album.images[0].url,
                name: data.item.name,
                artists: data.item.artists[0].name,
                album: data.item.album.name,
                explicit: data.item.explicit,
                duration_ms: data.item.duration_ms,
                progress_ms: data.progress_ms
            }));
            // Avoid duplicate being added to played database
            if (currentSong != data.item.id) {
                currentSong = data.item.id;
                fetch('/controlpanel/addToPlayed?' + new URLSearchParams({
                    id: data.item.id,
                    albumart: data.item.album.images[1].url,
                    name: data.item.name,
                    artists: data.item.artists[0].name,
                    album: data.item.album.name,
                    explicit: data.item.explicit,
                    duration_ms: data.item.duration_ms
                }))
                .then(response => response.json())
                .then(data => {
                    console.log('add to played', data);
                })
            }
        });
    }, 1000);
}

function populateAllTables() {
    setInterval(() => {
        fetch('/controlpanel/getalltables').then(response => response.json()).then(data => {
            const HEADINGS = data.headings;
            data = [
                data.songs_played,
                data.song_requests,
                data.users
            ];
            const columnsToHide = ['_id', 'ID'];
            const showImageInstead = ['Album_Art'];
            const columnHeadingsToHide = ['Album_Art', 'Explicit'];

            for (var i = 0; i < data.length; i++) {
                // Don't add anything if there is no data
                if (data[i].length == 0) {
                    return;
                }

                // Table DOM element for this table
                let table = document.getElementById(HEADINGS[i]);

                // Remove all children
                while (table.firstChild) {
                    table.removeChild(table.firstChild);
                }

                // Add headings to table
                let thead = document.createElement('thead');
                let theadtr = document.createElement('tr');
                for (let key in data[i][0]) {
                    let th = document.createElement('th');
                    th.setAttribute('scope', 'col');
                    th.className = 'text-center';
                    // Skip ones that we don't want to show up in table
                    if (columnsToHide.includes(key)) {
                        continue;
                    }
                    if (columnHeadingsToHide.includes(key)) {
                        key = '';
                    }
                    th.innerHTML = key;
                    theadtr.appendChild(th);
                    thead.appendChild(theadtr);
                }
                table.appendChild(thead);

                // Add data to table
                let tbody = document.createElement('tbody');
                for (let j = 0; j < data[i].length; j++) {
                    let tr = document.createElement('tr');
                    for (let key in data[i][j]) {
                        // Skip ones that we don't want to show up in table
                        if (columnsToHide.includes(key)) {
                            continue;
                        }
                        // Show image instead of link
                        if (showImageInstead.includes(key)) {
                            let td = document.createElement('td');
                            let img = document.createElement('img');
                            img.setAttribute('src', data[i][j][key]);
                            img.setAttribute('width', '50px');
                            img.setAttribute('height', '50px');
                            td.appendChild(img);
                            tr.appendChild(td);
                            continue;
                        }
                        // Show explicit image
                        if (key === 'Explicit') {
                            let td = document.createElement('td');
                            td.className = 'text-center';
                            if (data[i][j][key]) {
                                let img = document.createElement('img');
                                img.className = 'e-icon';
                                img.setAttribute('src', '/e.png');
                                img.setAttribute('width', '20px');
                                img.setAttribute('height', '20px');
                                td.appendChild(img);
                            }
                            tr.appendChild(td);
                            continue;
                        }
                        // Show duration in minutes
                        if (key === 'Length') {
                            let td = document.createElement('td');
                            td.className = 'text-center';
                            td.innerHTML = fancyTimeFormat(data[i][j][key]);
                            tr.appendChild(td);
                            continue;
                        }
                        let td = document.createElement('td');
                        td.className = 'text-center';
                        td.innerHTML = data[i][j][key];
                        tr.appendChild(td);
                    }
                    tbody.appendChild(tr);
                }
                table.appendChild(tbody);
            }
        });
    }, 1000);
}

function addToTable(tableElement, row) {
    let rowElement = document.createElement('tr');
    Object.keys(row).forEach(data_name => {
        let cellElement = document.createElement('td');
        cellElement.innerHTML = row[data_name];
        rowElement.append(cellElement);
    });
    tableElement.append(rowElement);
}

function fancyTimeFormat(duration){   
    // Hours, minutes and seconds
    duration /= 1000;
    var hrs = ~~(duration / 3600);
    var mins = ~~((duration % 3600) / 60);
    var secs = ~~duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
} 