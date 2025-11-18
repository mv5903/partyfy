import { BsExplicitFill } from 'react-icons/bs';
import { FaShare } from "react-icons/fa";

const SpotifyLinkBack = ({link, explicit} : {link: string, explicit?: boolean}) => {
    return (
        <a
            href={link}
            target="_blank"
            className="flex items-center mt-1 mr-1 text-white p-1 rounded-md hover:bg-primary-focus transition w-6 h-6"
            rel="noopener noreferrer"
        >
            <img src="/spotify-white.png" alt="Spotify Logo" />
            {explicit && <BsExplicitFill className="ml-1 text-white" />}
        </a>
    );
}

export default SpotifyLinkBack;