import whiteSpotifyLogo from '@/pages/assets/white.png';
import { BsExplicitFill } from 'react-icons/bs';
import { FaShare, FaShareAlt } from "react-icons/fa";

const SpotifyLinkBack = ({link, explicit} : {link: string, explicit?: boolean}) => {
    return (
        <a 
            href={link} 
            target="_blank" 
            className="flex items-center mt-1 mr-1 text-white p-1 rounded-md hover:bg-primary-focus transition"
            rel="noopener noreferrer"
        >
            <img src={whiteSpotifyLogo.src} className="w-4 h-4" alt="Spotify Logo" />
            <FaShareAlt size={12} className="ml-1" />
            {explicit && <BsExplicitFill className="ml-1 text-white" />}
        </a>
    );
}

export default SpotifyLinkBack;