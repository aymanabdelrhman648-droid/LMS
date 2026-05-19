import React from 'react'
import {
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  BookOpen,
  Users,
  FileText,
  HelpCircle,
  Shield,
  HandHelping,
  HelpingHand,
} from "lucide-react";

const iconMap = {
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  BookOpen,
  Users,
  FileText,
  HelpCircle,
  Shield,
  HandHelping,
};

import { footerStyles,
    footerBackgroundStyles,
    contactIconGradients,
    iconColors,
    footerCustomStyles
 } from '../assets/dummyStyles';

import {socialIcons,
    quickLinks,
    supportLinks,
    contactInfo
} from '../assets/dummyFooter';

import logo from '../assets/logo.png';
const Footer = () => {
  return (
     <footer className={footerStyles.footer}>
          <div className={footerBackgroundStyles.backgroundContainer}>
            <div className={footerBackgroundStyles.floatingOrb1}></div>
            <div className={footerBackgroundStyles.floatingOrb2}></div>
            <div className={footerBackgroundStyles.floatingOrb3}></div> 
            <div className={footerBackgroundStyles.floatingOrb4}></div>

            <div className={footerBackgroundStyles.gridOverlay}>
             <div
            className="w-full h-full"
            style={{
              backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
           />
            </div>
            </div>

            <div className={footerStyles.container}>
               <div className={footerStyles.grid}>
                  <div className={footerStyles.brandSection}>
                     <div className={footerStyles.brandTransform}>
                         <div className={footerStyles.brandContainer}>
                            <div className={footerStyles.brandGradient}></div>

                            <div className='font-serif flex items-center gap-3 relative'>
                                <img src={logo} alt="Logo" className="w-16 h-16" />
                                <h3 className={footerStyles.brandTitle}>SkillForge</h3>
                            </div>
                          </div>

                          <p className={footerStyles.brandDescription}>
                            Empowering learners with cutting-edge skills and knowledge.
                          </p>
                     </div>
                  </div>

                  <div>
                        <h4 className={`${iconColors.cyan}${footerStyles.sectionHeader}`}>
                        <ArrowRight className={footerStyles.sectionIcon} />
                         Quick Links
                        </h4>

                        <ul className={footerStyles.linksList}>
                            {quickLinks.map((link, i) => {
                                const IconComponent = iconMap[link.iconKey] || ArrowRight;
                                return (
                                    <li key={link.name} className={footerStyles.linkItem}>
                                       <a href={link.href}
                                        className={`hover:text-${iconColors.purple} ${footerStyles.linkItem}`}
                                        style={{
                                             transitionDelay : `${i*80}ms`,
                                        }}>
                                          <IconComponent className={`${footerStyles.linkIcon} ${iconColors.purple}`} />
                                          <span className='truncate'>{link.name}</span>
                                       </a>
                                    </li>
                                );
                            })}
                        </ul>
                  </div>  

                            <div>
                        <h4 className={`${iconColors.purple}${footerStyles.sectionHeader}`}>
                        <HelpingHand className={footerStyles.sectionIcon} />
                         Support
                        </h4>

                        <ul className={footerStyles.linksList}>
                            {supportLinks.map((link, i) => {
                                const IconComponent = iconMap[link.iconKey] || HelpCircle;
                                return (
                                    <li key={link.name} className={footerStyles.linkItem}>
                                       <a href={link.href}
                                        className={`hover:text-${iconColors.purple} ${footerStyles.linkItem}`}
                                        style={{
                                             transitionDelay : `${i*80}ms`,
                                        }}>
                                          <IconComponent className={`${footerStyles.linkIcon} ${iconColors.purple}`} />
                                          <span className='truncate'>{link.name}</span>
                                       </a>
                                    </li>
                                );
                            })}
                        </ul>
                  </div>  

                  <div>
                     <h4 className={`${iconColors.emerald}${footerStyles.sectionHeader}`}>
                        <Phone className={footerStyles.sectionIcon} />
                         Contact Us
                        </h4>
                        <div className={footerStyles.contactSpace}>
                            <div className={footerStyles.contactItem}>
                                <div className={`${contactIconGradients.address} ${footerCustomStyles.contactIconContainer}`}>
                                    <MapPin className={`${footerStyles.contactIcon} ${iconColors.cyan600}`} />
                                </div>
                               <div className={footerStyles.contactTextContainer}>
                                  <p className={footerStyles.contactTextPrimary}>{contactInfo.addressLine1}</p>
                                  <p className={footerStyles.contactTextSecondary}>{contactInfo.addressLine2}</p>
                               </div>
                            </div>
                        </div>
                  </div>
                    <div>
                  </div>
               </div>
            </div>
            <style>{footerCustomStyles}</style>
     </footer>
  )
}

export default Footer