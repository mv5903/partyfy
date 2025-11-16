import { BsExplicitFill } from "react-icons/bs";
import SpotifyLinkBack from "./SpotifyLinkBack";
import { Button } from "@/components/ui/button";
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
        btnContent,
        btnOnClick,
        btnIcon,
        btnColorClass,
        position
    } = props;

    // Map RippleUI button classes to shadcn button variants
    const getButtonVariant = (colorClass: string) => {
        if (!colorClass) return "default";
        if (colorClass.includes('btn-primary') || colorClass.includes('bg-blue')) return "default";
        if (colorClass.includes('btn-success') || colorClass.includes('bg-green')) return "success";
        if (colorClass.includes('btn-warning')) return "warning";
        if (colorClass.includes('btn-secondary')) return "secondary";
        if (colorClass.includes('btn-error') || colorClass.includes('btn-danger')) return "destructive";
        return "default";
    };

    return (
        <Card className="my-2 bg-stone-800 w-full shadow-md rounded-md border-stone-700">
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
                            <span className="text-white">{primaryContent}</span>
                            :
                            primaryContent
                        }
                        {explicit && <BsExplicitFill className="ms-2 text-white" />}
                    </div>
                    <p className="text-xs text-gray-400 italic mt-0.5">{secondaryContent}</p>
                </div>
                <div className="flex-shrink-0">
                    <Button
                        variant={getButtonVariant(btnColorClass)}
                        className="flex items-center gap-1"
                        onClick={btnOnClick}
                    >
                        {btnIcon && <span>{btnIcon}</span>}
                        {btnContent}
                    </Button>
                </div>
            </div>
        </Card>
    );
}

export default ListContentCard;
export type { ListContentCardProps };

