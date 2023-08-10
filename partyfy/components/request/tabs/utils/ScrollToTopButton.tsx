import { FaArrowUp } from "react-icons/fa";

export default function ScrollToTopButton() {
    return (
        <div>
            <FaArrowUp className="p-2 fixed bg-secondary rounded opacity-75" size={40} style={{ left: '10px', zIndex: '2', bottom: '15%' }} onClick={() => window.scrollTo(0, 0)}></FaArrowUp>
        </div>
    )
}