import React, { useRef } from "react";

const Home = () => {
    const rolRef = useRef(null);

    const handleMenuClick = () => {
        if (rolRef.current) {
            rolRef.current.style.transform = "rotatex(-90deg)";
        }
    };

    const handleBackClick = () => {
        if (rolRef.current) {
            rolRef.current.style.transform = "rotatex(0deg)";
        }
    };

    return (
        <div id="container">
            <nav className="nav-menu">
                <div id="cont_mnu">
                    <span id="btn_two" className="btn animate" onClick={handleBackClick}>
                        CLOSE
                    </span>
                </div>

                <ul className="ul_mnu">
                    <li><a href="#" className="li_mnu"><i>-</i> HOME <i>-</i></a></li>
                    <li><a href="#" className="li_mnu"><i>-</i> ABOUT <i>-</i></a></li>
                    <li><a href="#" className="li_mnu"><i>-</i> SKILLS <i>-</i></a></li>
                    <li><a href="#" className="li_mnu"><i>-</i> WORK <i>-</i></a></li>
                    <li><a href="#" className="li_mnu"><i>-</i> CONTACT <i>-</i></a></li>
                </ul>
            </nav>

            <div id="rol" ref={rolRef}>
                <span id="btn_mnu" onClick={handleMenuClick}><br />&nbsp;&nbsp;MENU</span>
                <div className="logo"><h1>JK</h1></div>
                <div className="headline">
                    <h1><span className="allan">Making it </span><span>Simple for you.</span></h1>
                    <h2>Jay Panchal</h2>
                </div>
            </div>



        </div>
    );
};

export default Home;
