import React from "react";
import { Link } from "react-dom";

const Navbar = ({onLogout}) => {
    return(
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-indigo-600">Instagram</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button
                        onClick={onLogout}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar