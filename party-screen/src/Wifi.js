import wifiimage from './assets/wifi.png';
import { FaWifi } from 'react-icons/fa';

export default function Wifi() {
    return(
        <div className="wifi">
            <div className="center">
                <h2 className="wifi-title">Wi-Fi</h2>
                <FaWifi/>
            </div>
            <p>SSID: Matt's Room</p>
            <p>Password: 6638Weyers</p>
            <img src={wifiimage} alt="wifi" id="wifi-image"/>
        </div>
    )
}