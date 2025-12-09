import { BsExplicitFill } from "react-icons/bs";
import SpotifyLinkBack from "./SpotifyLinkBack";
import { Card } from "@/components/ui/card";
import ScrollingText from "./ScrollingText";

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
            className="bg-stone-900 border-stone-700 cursor-pointer hover:bg-stone-700 hover:border-stone-600 transition-all duration-200"
            onClick={btnOnClick}
        >
            <div className="flex items-center justify-between p-3 gap-2 w-full">
                {
                    typeof imgSrc === 'string'
                    ?
                    <img src={imgSrc} className="w-12 h-12 object-cover rounded flex-shrink-0" alt="Thumbnail" />
                    :
                    <div className="w-12 h-12 overflow-hidden rounded flex-shrink-0">
                        {imgSrc}
                    </div>
                }
                <div className="flex-grow min-w-0">
                    <div className="flex items-start gap-2 w-full min-w-0">
                        {
                            typeof primaryContent === 'string'
                            ?
                            <ScrollingText text={primaryContent} className="text-white font-semibold text-base flex-1 min-w-0" />
                            :
                            <div className="text-white font-semibold text-base line-clamp-1 flex-1 min-w-0">{primaryContent}</div>
                        }
                        {explicit && <BsExplicitFill className="text-gray-400 flex-shrink-0" size={16} />}
                    </div>
                    <div className="min-w-0">
                        <ScrollingText text={secondaryContent} className="text-sm text-gray-400 italic" />
                    </div>
                </div>
                { spotifyLinkBack &&
                    <div
                        className="flex-shrink-0"
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

