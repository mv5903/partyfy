const CurrentAlert = () => {
    const showAlert = true;
    const alertMessage = 
        <>
            <span>
                We are aware of an issue where some new users are unable to save a username. This appears to be an issue on the website only. If you are experiencing this issue, please try again on the <a className="underline" href="https://apps.apple.com/us/app/partyfy-queue-management/id6463042237" target="_blank">iOS App</a> or <a className="underline" href="https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DAndroid" target="_blank">install the PWA</a>. Thank you for your cooperation while we develop a fix.
            </span>
        </>;

    if (!showAlert) return null;

    return (
        <div className="p-4">
            <div className={`alert alert-info text-sm`}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4ZM24 26C22.9 26 22 25.1 22 24V16C22 14.9 22.9 14 24 14C25.1 14 26 14.9 26 16V24C26 25.1 25.1 26 24 26ZM26 34H22V30H26V34Z" fill="#0085FF" />
                </svg>
                <div className="flex w-full justify-between">
                    <div className="flex flex-col">
                        <span className="text-content2 text-xl font-bold">Username Issue</span>
                        <span className="text-content2 pe-4">{alertMessage}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CurrentAlert;