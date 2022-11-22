import wifiimage from './assets/wifi.png';
import request from './assets/request.png';
import { FaWifi } from 'react-icons/fa';
import { GiLoveSong } from 'react-icons/gi';

export default function Wifi() {
    return(
        <div>
            <div className="wifi">
                <div className="center">
                    <h2 className="wifi-title">Wi-Fi</h2>
                    <FaWifi/>
                </div>
                <p>SSID: Matt's Room</p>
                <p>Password: 6638Weyers</p>
                <img src={wifiimage} alt="wifi" id="wifi-image"/>
            </div>
            <div className="wifi move">
                <div className="center">
                    <h2 className="wifi-title">Song Requests</h2>
                    <GiLoveSong/>
                </div>
                <p>Scan Below!</p>
                <p>You must be connected</p>
                <p>to the Wi-Fi!</p>
                <img src={request} alt="request" id="wifi-image"/>
            </div>
        </div>
    )
}