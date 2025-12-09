import { Spinner } from "@/components/ui/spinner";

const LoadingDots = function ({ className }: { className?: string } ) {
    return (
        <div className="flex justify-center">
            <Spinner variant="dots" className={className} />
        </div>
    );
}

export default LoadingDots;
