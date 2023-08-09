import { FaShare } from "react-icons/fa";
import whiteSpotifyLogo from '@/pages/assets/white.png';

const SpotifyLinkBack = ({link} : {link: string}) => {
    return (
        <button onClick={() => window.location.href = link} className="flex items-center m-2">
            <img src={whiteSpotifyLogo.src} style={{ width: '25px', height: '25px' }} />
            <FaShare size={20} className="ms-2" />
        </button>
    );
}

export default SpotifyLinkBack;