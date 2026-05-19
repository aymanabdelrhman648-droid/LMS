import React,{useState, useEffect} from 'react'
import { aboutUsStyles , aboutUsAnimations } from '../assets/dummyStyles'
import {counterTargets , statsMeta , missionVisionValues , teamMembers , values , testimonials} from '../assets/dummyAbout'
import { BadgeCheck, Star } from 'lucide-react'
import AboutBanner from '../assets/AboutBannerImage.png'
import {DotLottieReact} from '@lottiefiles/dotlottie-react'

const About = () => {
    const [counterValues, setCounterValues] = useState({
    students: 0,
    courses: 0,
    successRate: 0,
    countries: 0,
    certificates: 0,
    support: 0,
    });

      // Animated counter effect using imported counterTargets
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    const timers = [];

    Object.keys(counterTargets).forEach((key) => {
      let current = 0;
      const target = counterTargets[key];
      const increment = target / steps;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setCounterValues((prev) => ({
          ...prev,
          [key]: Math.floor(current),
        }));
      }, stepDuration);

      timers.push(timer);
    });

    return () => timers.forEach((t) => clearInterval(t));
  }, []);

   const formatStatNumber = (key) => {
    if (key === "support") return "24/7";
    if (key === "successRate") return `${counterValues.successRate}%`;
    const val = counterValues[key] ?? 0;
    // certificates might be large -> show with commas and plus
    if (key === "certificates") return `${val.toLocaleString()}+`;
    return `${val.toLocaleString()}+`;
  };


  return (
    <div className={aboutUsStyles.container}>
        <section className={aboutUsStyles.heroSection}>
                 <div className={aboutUsStyles.heroBackground}>
                         <div style={{
                               backgroundImage : `url(${AboutBanner})`,
                               opacity: 0.85,
                        }}
                         className={aboutUsStyles.heroImageContainer}/>

                      <div
                         className={aboutUsStyles.heroVignette}
                          style={{
                           background:
                         "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.0) 70%, rgba(0,0,0,0.72) 100%)",
                        }}
                      />
                      <div className={aboutUsStyles.heroTint}></div>

                 </div>

                 <div className={aboutUsStyles.heroContent}>
                        <div className={aboutUsStyles.trustBadge}>
                            <Star className={aboutUsStyles.trustIcon}/>
                            Trusted by 50,000+ students worldwide
                        </div>
                        <h1 className={aboutUsStyles.mainHeading}>About LearnHub</h1>
                        <p className={aboutUsStyles.subHeading}>Empowering millions to achieve dreams throughaccessible education</p>
                        <div className={aboutUsStyles.statsGrid}>
                            {statsMeta.slice(0,4).map((card,index)=>(
                                <div className={aboutUsStyles.statCard} key={index}>
                                     <div className={aboutUsStyles.statNumber}>
                                         {formatStatNumber(card.key)}
                                     </div>
                                     <div className={aboutUsStyles.statLabel}>
                                        {card.label}
                                     </div>
                                </div>
                            ))}
                        </div>
                 </div> 
            </section>

            {missionVisionValues.map((section , index) => (
                  <section key={section.type}
                  className={`${aboutUsStyles.sectionContainer} 
                  ${section.bgColor} ${section.bgColor} ${index % 2 == 1 ? "bg-white" : ""}`}>
                          <div className={aboutUsStyles.sectionGrid}>
                                 <div className={aboutUsStyles.sectionContentGrid}>
                                        <div className={`${aboutUsStyles.sectionImageContainer} 
                                          ${index % 2 == 1 ? "lg:col-start-2" : ""}`}>
                                                <div className={aboutUsStyles.sectionImage}> 
                                                      <DotLottieReact src={section.dotLottie} loop autoplay/>
                                                </div>
                                          </div>

                                       <div className={`${aboutUsStyles.sectionContent} 
                                       ${index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                                             <div className={aboutUsStyles.sectionBadge} >
                                                  <section.icon 
                                                  className={`${aboutUsStyles.sectionIcon} ${section.color}`}/>
                                                <span className={aboutUsStyles.sectionBadgeText}>
                                                    {section.subtitle}
                                                </span>
                                             </div>
                                            <h2 className={aboutUsStyles.sectionTitle}>{section.title}</h2>
                                            <p className={aboutUsStyles.sectionDescription}>{section.description}</p>
                                            <div className={aboutUsStyles.featuresContainer}>
                                              {section.features.map((feature,index)=>(
                                                   <div className={aboutUsStyles.featureItem} 
                                                   key={index}>
                                                          <div className={`${aboutUsStyles.featureIcon} ${section.color}`}>
                                                               <BadgeCheck className={aboutUsStyles.featureIconSvg}/> 
                                                          </div>
                                                          <span className={aboutUsStyles.featureText}>
                                                             {feature}
                                                          </span>

                                                   </div>
                                              ))}

                                            </div>
                                        </div>   

                                      
                                 </div>
                          </div>
                  </section>
            ))}

            <section className={aboutUsStyles.testimonialsSection}>
        <div className={aboutUsStyles.sectionGrid}>
          <div className={aboutUsStyles.testimonialsHeader}>
            <h2 className={aboutUsStyles.testimonialsTitle}>
              What Our Students Say
            </h2>
            <p className={aboutUsStyles.testimonialsSubtitle}>
              Real stories from real learners who transformed their careers
            </p>
          </div>
          <div className={aboutUsStyles.testimonialsGrid}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className={aboutUsStyles.testimonialCard}>
                <div className={aboutUsStyles.testimonialStars}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className={aboutUsStyles.testimonialStar} />
                  ))}
                </div>
                <p className={aboutUsStyles.testimonialText}>
                  "{testimonial.text}"
                </p>
                <div className={aboutUsStyles.testimonialAuthor}>
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className={aboutUsStyles.testimonialAvatar}
                  />
                  <div>
                    <div className={aboutUsStyles.testimonialAuthorName}>
                      {testimonial.name}
                    </div>
                    <div className={aboutUsStyles.testimonialAuthorRole}>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
           </section>

           <section className={aboutUsStyles.ctaSection}>
               <div className={aboutUsStyles.ctaOrb1}></div>
               <div className={aboutUsStyles.ctaOrb2}></div>
                
                <div className={aboutUsStyles.ctaContent}>
                      <h2 className={aboutUsStyles.ctaTitle}>Ready to get started?</h2>
                      <p className={aboutUsStyles.ctaDescription}>
                        Join thousands of satisfied learners today!
                      </p>
                </div>

           </section>
        <style jsx="true">{aboutUsAnimations}</style>
    </div>
  )
}

export default About