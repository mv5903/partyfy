import { FaArrowUp } from "react-icons/fa";

export default function ScrollToTopButton() {
    return (
        <div>
            <FaArrowUp className="p-2 position-fixed bg-primary rounded opacity-75" size={40} style={{ left: '10px', zIndex: '2', bottom: '30%' }} onClick={() => window.scrollTo(0, 0)}></FaArrowUp>
        </div>
    )
}