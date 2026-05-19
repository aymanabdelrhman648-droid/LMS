import React, { useRef, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom';
import { navbarStyles } from '../../assets/dummyStyles'
import logo from '../../assets/public/logo.png'
import { LayoutDashboard, PlusCircle, ListChecks, X, Menu } from "lucide-react";
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isVisible, setIsVisible] = useState(true);   // ✅ true so navbar shows on load
  const [isMenuOpen, setMenuOpen] = useState(false);  // ✅ false so mobile menu starts closed
  const location = useLocation();
  const menuRef = useRef(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }

    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMenuOpen]);
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { id: "addcourse", label: "Add Course", icon: PlusCircle, path: "/addcourse" },
    { id: "listcourse", label: "List Courses", icon: ListChecks, path: "/listcourse" },
    { id: "bookings", label: "Bookings", icon: ListChecks, path: "/bookings" },
  ];

  return (
      <>
           <nav className={navbarStyles.nav(isVisible)}>
      <div className={navbarStyles.navContainer}>
        <div ref={menuRef} className={navbarStyles.navInner(isMenuOpen)}>
          <div className={navbarStyles.glowEffect}></div>
          <div className={navbarStyles.navbarContent}>

            {/* Logo */}
            <div className={navbarStyles.logoContainer}>
              <img src={logo} className={navbarStyles.logoImage} />
              <div className="leading-[0.95]">
                <div className={navbarStyles.logoText}>Skillforge</div>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className={navbarStyles.desktopNav}>
              <div className={navbarStyles.desktopNavInner}>
                {menuItems.map(({ id, label, icon: Icon, path }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link key={id} to={path} className={navbarStyles.desktopNavItem(isActive)}>
                      <Icon className="w-5 h-5" />
                      <span className="md:text-xs xl:text-lg lg:text-md">{label}</span>
                      {isActive && <span className={navbarStyles.desktopActiveGlow} />}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Mobile Toggle */}
            <div className={navbarStyles.mobileToggleContainer}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!isMenuOpen); // ✅ correct casing
                }}
                className={navbarStyles.mobileToggleButton}
              >
                {isMenuOpen ? (
                  <X className={navbarStyles.mobileToggleIcon} />
                ) : (
                  <Menu className={navbarStyles.mobileToggleIcon} />
                )}
              </button>
            </div>

          </div>

          {/* Mobile Menu */}
          <div className={navbarStyles.mobileMenu(isMenuOpen)}>
            <div className={navbarStyles.mobileMenuInner}>
              {menuItems.map(({ id, label, icon: Icon, path }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={id}
                    to={path}
                    className={navbarStyles.mobileMenuItem(isActive)}
                    onClick={() => setMenuOpen(false)} // ✅ correct casing
                  >
                    <Icon className={navbarStyles.mobileMenuIcon} />
                    <span className={navbarStyles.mobileMenuText}>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </nav>
      </>
  );
}

export default Navbar;