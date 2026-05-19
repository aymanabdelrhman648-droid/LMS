import {useState} from 'react'
import { bannerStyles , customStyles} from '../assets/dummyStyles'
import { features, floatingIcons } from '../assets/dummyBanner'
import { CircleCheckBig, Sparkle, X } from 'lucide-react'
import Bannerimage from '../assets/Bannerimage.jpg'
import video from '../assets/bannerVideo.mp4'
const Banner = () => {

   const [showVideo, setShowVideo] = useState(false);
  return (
    <div className={bannerStyles.container}>
          {/* Floating Icons Wrapper */}
      <div className={bannerStyles.floatingIconsWrapper}>
        {floatingIcons.map((icon, i) => (
          <img
            key={i}
            src={icon.src}
            alt={icon.alt || ""}
            className={`${bannerStyles.floatingIcon} ${icon.pos}`}
            style={{
              animationDelay: `${i * 0.35}s`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>

      <div className={bannerStyles.mainContent}>
         <div className={bannerStyles.grid}>
          <div className={bannerStyles.leftContent}>
              <span className={bannerStyles.badge}>
                 <Sparkle className={bannerStyles.badgeIcon} />
                  New Features
              </span>

              <h1 className={bannerStyles.heading}>
                  <span className={bannerStyles.headingSpan1}>Building Amazing</span>
                  <span className={bannerStyles.headingSpan2}>Digital Products</span>
              </h1>
              <p className={bannerStyles.description}>
                Create beautiful, responsive web applications with our powerful tools and components. Start building your next project today.
              </p>

              <div className={bannerStyles.featuresGrid}>
                {features.map((feature, i) => (
                  <div key={i} className={bannerStyles.featureItem}>
                     <div className={bannerStyles.featureIconContainer}>
                          <span className={`${bannerStyles.featureIcon} text-${feature.color}-500`}>
                           <CircleCheckBig size={16} /> 
                          </span>
                     </div>
                      <span className={bannerStyles.featureText}>
                        {feature.text}
                      </span>

                  </div>
                  
                ))}
               </div>
              
              <div className={bannerStyles.buttonsContainer}>
                <a href="/courses" className={bannerStyles.buttonGetStarted}>
                  Get Started
                </a>

                <button 
                className={bannerStyles.buttonViewDemo}
                onClick={()=> setShowVideo(true)} >
                  View Demo
                </button>

              </div>
               
              </div>
              
            <div className={bannerStyles.imageContainer}>
                <img src={Bannerimage} alt="Banner" className={bannerStyles.image} />
            </div>
            </div> 

         </div>

         
           {showVideo && (
               <div className={bannerStyles.videoModal.overlay}> 
                   <div className={bannerStyles.videoModal.container}>
                     <iframe
                      src={video}
                     className={bannerStyles.videoModal.iframe}
                     allow='autoplay'
                     allowFullScreen >
                      </iframe>

                      <button className={bannerStyles.videoModal.closeButton}
                       onclick={() => setShowVideo(false)}>
                          <span>
                            <X className={bannerStyles.videoModal.closeIcon} />
                          </span>
                      </button>
                   </div>
               </div> 
           )    
           }
         
        <style jsx="true">{customStyles}</style>
      </div>
    
  )
}

export default Banner;