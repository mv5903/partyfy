export async function getRecentsSchema() {
    let response = await fetch('/api/database/recents?schema=true');
    let json = await response.json();
    return json.recordsets[0].map((item : any) => item.COLUMN_NAME);
}