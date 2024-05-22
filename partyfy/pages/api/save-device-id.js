export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { deviceId } = req.body;

        if (!deviceId) {
            return res.status(400).json({ message: 'Device ID is required' });
        }

        // Save the deviceId in your database
        // This example uses an in-memory store; replace with your database logic
        const deviceIds = new Set();
        deviceIds.add(deviceId);

        res.status(200).json({ message: 'Device ID saved', deviceId });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
