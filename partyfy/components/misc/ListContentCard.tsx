import { BsExplicitFill } from "react-icons/bs";
import SpotifyLinkBack from "./SpotifyLinkBack";
import { Card } from "@/components/ui/card";

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
        btnOnClick
    } = props;

    return (
        <Card
            className="bg-stone-800 border-stone-800 mx-auto w-[92vw] cursor-pointer transition-colors group"
            onClick={btnOnClick}
        >
            <div className="flex items-center justify-between p-4 gap-4 w-full">
                {
                    typeof imgSrc === 'string'
                    ?
                    <img src={imgSrc} className="w-16 h-16 object-cover" alt="Thumbnail" />
                    :
                    <div className="w-16 h-16 overflow-hidden">
                        {imgSrc}
                    </div>
                }
                <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-center gap-2">
                        {
                            typeof primaryContent === 'string'
                            ?
                            <h4 className="text-white font-medium text-base line-clamp-1">{primaryContent}</h4>
                            :
                            <div className="text-white font-medium text-base line-clamp-1">{primaryContent}</div>
                        }
                        {explicit && <BsExplicitFill className="text-gray-400 flex-shrink-0" size={16} />}
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-1 mt-1.5">{secondaryContent}</p>
                </div>
                { spotifyLinkBack &&
                    <div
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <SpotifyLinkBack link={spotifyLinkBack} />
                    </div>
                }
            </div>
        </Card>
    );
}

export default ListContentCard;
export type { ListContentCardProps };

