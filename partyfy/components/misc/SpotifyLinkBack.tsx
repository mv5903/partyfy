import { FaShare } from "react-icons/fa";
import whiteSpotifyLogo from '@/pages/assets/white.png';

const SpotifyLinkBack = ({link} : {link: string}) => {
    return (
        <div className="d-flex flex-row align-items-center justify-content-center">
            <a href={link} target="_blank" className="d-flex align-items-center m-2">
                <img src={whiteSpotifyLogo.src} style={{ width: '25px', height: '25px' }} />
                <FaShare className="ms-2" size={15} color="white" />
            </a>
        </div>
    );
}

export default SpotifyLinkBack;