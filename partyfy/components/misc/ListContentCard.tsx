import { BsExplicitFill } from "react-icons/bs";
import SpotifyLinkBack from "./SpotifyLinkBack";

interface ListContentCardProps {
    imgSrc: string | JSX.Element;
    spotifyLinkBack?: string;
    primaryContent: JSX.Element | string;
    secondaryContent: string;
    explicit: boolean | null;
    btnContent?: JSX.Element;
    btnOnClick: (any) => void;
    btnIcon: JSX.Element;
    btnColorClass?: string;
    position?: number;
}

function ListContentCard(props: ListContentCardProps) {

    const {
        imgSrc,
        spotifyLinkBack,
        primaryContent,
        secondaryContent,
        explicit,
        btnContent,
        btnOnClick,
        btnIcon,
        btnColorClass,
        position
    } = props;

    return (
        <div className="card my-2 bg-zinc-900 w-full shadow-md rounded-md">
            <div className="flex items-center p-2 gap-2">
                {position && <span className="text-white text-xs rounded-md px-1">{position}</span>}
                <div className="flex-shrink-0 mr-2">
                    {
                        typeof imgSrc === 'string' 
                        ?
                        <img src={imgSrc} className="w-12 h-12 object-contain" alt="Thumbnail" />
                        :
                        imgSrc
                    }
                    { spotifyLinkBack && <SpotifyLinkBack link={spotifyLinkBack} /> }
                </div>
                <div className="flex-grow">
                    <div className="text-base font-medium flex items-center justify-center">
                        {
                            typeof primaryContent === 'string'
                            ?
                            <span>{primaryContent}</span>
                            :
                            primaryContent
                        }
                        {explicit && <BsExplicitFill className="ms-2 text-white" />}
                    </div>
                    <p className="text-xs text-gray-400 italic mt-0.5">{secondaryContent}</p>
                </div>
                <div className="flex-shrink-0">
                    <button 
                        className={`btn ${btnColorClass} flex items-center gap-1`} 
                        onClick={btnOnClick}
                    >
                        {btnIcon && <span>{btnIcon}</span>}
                        {btnContent}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ListContentCard;
export type { ListContentCardProps };

