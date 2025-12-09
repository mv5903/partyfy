import Image from 'next/image';
import appStoreIcon from "../../public/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg";
import appLogo from "../../public/logo.png";

export default function PromotionalHeader() {
    return (
        <div className="card flex-row w-auto flex mx-auto m-3 p-2 gap-3 justify-center place-items-center">
            <div className="w-10">
                <img src={"/logo.png"} className='bg-stone-900 rounded-full' alt="Logo" />
            </div>
            <a href="https://apps.apple.com/us/app/partyfy-queue-management/id6463042237" target="_blank">
                <Image priority src={appStoreIcon} alt="Partyfy iOS App" />
            </a>
        </div>
    )
}