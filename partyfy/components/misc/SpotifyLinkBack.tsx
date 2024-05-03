import whiteSpotifyLogo from '@/pages/assets/white.png';
import { FaShare } from "react-icons/fa";

const SpotifyLinkBack = ({link} : {link: string}) => {
    return (
        <a href={link} target="_blank" className="flex items-center mt-2 mr-2">
            <img src={whiteSpotifyLogo.src} style={{ width: '25px', height: '25px' }} />
            <FaShare size={20} className="ms-2" />
        </a>
    );
}

export default SpotifyLinkBack;