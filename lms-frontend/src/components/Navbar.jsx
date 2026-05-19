import React, { useEffect } from 'react'
import { navbarStyles } from '../assets/dummyStyles'
import logo from '../assets/logo.png'
import { useState, useRef } from 'react'
import { Home, BookOpen, BookMarked, Users, Contact, X , Menu, BookOpenText} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {useClerk,useUser,useAuth,UserButton} from '@clerk/clerk-react';
const baseNav = [
  { name: "Home", icon: Home, href: "/" },
  { name: "Courses", icon: BookOpen, href: "/courses" },
  { name: "About", icon: BookMarked, href: "/about" },
  { name: "Faculty", icon: Users, href: "/faculty" },
  { name: "Contact", icon: Contact, href: "/contact" },
];

const desktopnavlink=(isActive) =>
      `${navbarStyles.desktopNavItem} 
    ${ isActive ? navbarStyles.desktopNavItemActive : ""}`;

    const mobilenavlink=(isActive) =>
      `${navbarStyles.mobileMenuItem} 
    ${ isActive ? navbarStyles.mobileMenuItemActive : navbarStyles.mobileMenuItemHover}`;


const Navbar = () => {

    const {openSignUp} = useClerk();
    const {isSignedIn} = useUser();
    const {getToken} = useAuth();
    const [shownavbar, setshownavbar] = useState(true);
    const  [isScrolled, setIsScrolled] = useState(false);
     const [isopen, setIsOpen] = useState(false);
     const [lastscrollY, setLastScrollY] = useState(0);
     const menuref = useRef(null);
    const islogged = isSignedIn && Boolean(localStorage.getItem("token"));

     const navItems = islogged ? [...baseNav, { name: "My Courses", icon: BookOpenText, href: "/mycourses" }] : baseNav;
 
    useEffect(() => {
         const loadToken = async () => {
             if(isSignedIn){
                   const token = await getToken();
                   localStorage.setItem("token", token);          
             }
         }
            loadToken();
    },[isSignedIn,getToken]) 
    
        useEffect(() => {
             if(!isSignedIn){
                  localStorage.removeItem("token");      
         }
     },[isSignedIn,getToken]) 

      useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem("token");
      console.log("Token removed instantly on Clerk logout event");
    };

    window.addEventListener("user:signed_out", handleLogout);
    return () => window.removeEventListener("user:signed_out", handleLogout);
  }, []);

  // Scroll hide/show
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      if (scrollY > lastscrollY && scrollY > 100) {
        setshownavbar(false);
      } else {
        setshownavbar(true);
      }
      setLastScrollY(scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastscrollY]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuref.current && !menuref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isopen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isopen]);

  return (
     <nav className={`${navbarStyles.navbar} ${shownavbar ? navbarStyles.navbarVisible : navbarStyles.navbarHidden} ${isScrolled ? navbarStyles.navbarScrolled : navbarStyles.navbarDefault} `} >
        <div className={navbarStyles.container}>
            <div className={navbarStyles.innerContainer}>
                <div className='flex items-center gap-2 select-none'>
                    <img src={logo} alt="" className='w-12 h-12' />
                    <div className='text-xl font-bold font-serif bg-linear-to-r from-sky-700 to-cyan-600
                    loading-[0.95] bg-clip-text text-transparent'>
                        skillforge
                    </div>
                </div>

             <div className={navbarStyles.desktopNav}>
                <div className={navbarStyles.desktopNavContainer}>
                     {navItems.map((item) =>{
                        const Icon = item.icon;
                        return (
                            <NavLink key={item.name} to={item.href} end={item.href === "/"} className={({isActive}) =>
                             desktopnavlink(isActive) }>
                                 <div className='flex items-center space-x-2'>
                                    <Icon size={16} className={navbarStyles.desktopNavIcon} />
                                    <span className={navbarStyles.desktopNavText}>
                                        {item.name}
                                    </span>
                                 </div>
                            </NavLink>
                        )
                     })}

                </div>

             </div>

            <div className={navbarStyles.authContainer}>
                {!isSignedIn ? (
                    <button onClick={() => openSignUp()} type={"button"} 
                    className={navbarStyles.loginButton}>
                         <span>Create Account</span>
                    </button>
                ):(
                     <div className='flex items-center'>
                        <UserButton afterSignOutUrl="/" />
                     </div>
                  )}

                <button onClick={() => setIsOpen(!isopen)}
                className={navbarStyles.mobileMenuButton}>
                    {isopen ? <X size={20} /> : <Menu size={20} />}
                </button>

            </div>
            </div>
            {/* Mobile Menu */}
            <div
              ref = {menuref}
              className={`${navbarStyles.mobileMenu} 
              ${isopen ? navbarStyles.mobileMenuOpen : navbarStyles.mobileMenuClosed}`} 
            >
                <div className={navbarStyles.mobileMenuContainer}>
                    <div className={navbarStyles.mobileMenuItems}>
                    {navItems.map((item) =>{
                        const Icon = item.icon;
                        return (
                            <NavLink key={item.name} to={item.href} end={item.href === "/"} className={({isActive}) =>
                             mobilenavlink(isActive) }
                             onClick={() => setIsOpen(false)}>
                                 <div className='flex items-center space-x-2'>
                                    <Icon size={16} className={navbarStyles.mobileMenuIcon} />
                                    <span className={navbarStyles.mobileMenuText}>
                                        {item.name}
                                    </span>
                                 </div>
                            </NavLink>
                        )
                     })}

                     {!isSignedIn ? (
                        <button onClick={() => {openSignUp()
                         setIsOpen(false)}} type={"button"} 
                        className={navbarStyles.mobileCreateAccountButton ?? navbarStyles.mobileLoginButton}>
                             <span>Create Account</span>
                        </button>
                    ):(
                         <div className='px-4 py-2'>
                            <UserButton afterSignOutUrl="/" />
                         </div>
                      )}
                    </div>
                    
                </div>
            </div>

        </div>
     </nav>
  )
}

export default Navbar