import { BsGlobe, BsPeopleFill } from "react-icons/bs";
import { FaExclamationCircle, FaHeart, FaHistory, FaSpotify } from "react-icons/fa";
import SpotifyLinkBack from "./SpotifyLinkBack";
import { Card } from "@/components/ui/card";

interface PlaylistCardProps {
    playlist: any;
    onClick: () => void;
}

function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
    const isLikedSongs = playlist.id === 'likedSongs';
    const isRecentSongs = playlist.id === 'recentSongs';
    const isNeedLikedSongsPermission = playlist.id === 'needLikedSongsPermission';

    return (
        <Card
            className="bg-stone-800 w-full shadow-md rounded-lg border-stone-800 cursor-pointer hover:bg-stone-700 transition-all duration-200 overflow-hidden group"
            onClick={onClick}
        >
            <div className="p-4 flex flex-col gap-3">
                {/* Image Section */}
                <div className="relative w-full aspect-square bg-stone-900overflow-hidden shadow-lg">
                    {playlist.images && playlist.images.length > 0 ? (
                        <img
                            src={playlist.images[0].url}
                            className="w-full h-full object-cover"
                            alt={playlist.name}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-700 to-stone-900">
                            {isLikedSongs && <FaHeart size={50} className="text-purple-400" />}
                            {isRecentSongs && <FaHistory size={50} className="text-blue-400" />}
                            {!isLikedSongs && !isRecentSongs && <FaSpotify size={50} className="text-green-400" />}
                        </div>
                    )}

                    {/* Spotify Link - Top Right Corner */}
                    {playlist.external_urls?.spotify && !isLikedSongs && !isRecentSongs && (
                        <div
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <SpotifyLinkBack link={playlist.external_urls.spotify} />
                        </div>
                    )}
                </div>

                {/* Text Section */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-center gap-2">
                        <h3 className="text-white font-semibold text-base line-clamp-2 text-center flex-grow">
                            {playlist.name}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                            {playlist.collaborative && (
                                <BsPeopleFill className="text-gray-400" size={14} />
                            )}
                            {playlist.public && (
                                <BsGlobe className="text-gray-400" size={14} />
                            )}
                            {isNeedLikedSongsPermission && (
                                <FaExclamationCircle className="text-red-500" size={14} />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <p className="text-gray-400 text-sm line-clamp-1 text-center">
                            {isLikedSongs ? 'Your Liked Songs' : playlist.owner?.display_name || 'Spotify'}
                        </p>
                    </div>

                    {playlist.tracks?.total !== undefined && (
                        <p className="text-gray-500 text-xs">
                            {playlist.tracks.total} {playlist.tracks.total === 1 ? 'song' : 'songs'}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}

export default PlaylistCard;
export type { PlaylistCardProps };
