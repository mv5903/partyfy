import { FaArrowUp } from "react-icons/fa";

export default function ScrollToTopButton() {
    return (
        <div className="position-sticky" style={{ textAlign: 'left', bottom: '20vh', zIndex:'2' }} >
            <FaArrowUp className="p-2 bg-primary rounded opacity-75" size={40} style={{ left: 0 }} onClick={() => window.scrollTo(0, 0)}></FaArrowUp>
        </div>
    )
}