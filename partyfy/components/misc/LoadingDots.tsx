
const LoadingDots = function ({ className }: { className?: string } ) {
    return (
        <div className="flex justify-center">
            <div className={`spinner-dot-intermittent ${className}`}></div>
        </div>
    );
}

export default LoadingDots;
