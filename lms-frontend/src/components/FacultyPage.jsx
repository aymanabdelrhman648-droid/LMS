import React from 'react';
import {facultyStyles} from '../assets/dummyStyles';
import sampleTeachers from '../assets/dummyFaculty';

 const motion = {
    div: ({ children, initial, animate, transition,className }) => (
         <div className={className}> 
            {children}
         </div>
    )
 }
const FacultyPage = () => {
  return (
    <div className={facultyStyles.container}>
        <div className={facultyStyles.header}>
            <div className={facultyStyles.headerContent}>
                <h1 className={facultyStyles.title}>Meet Our Faculty</h1>
                <div className={facultyStyles.titleDivider}></div>
                <p className={facultyStyles.subtitle}>
                    Learn from the best in the field. Our faculty members are renowned experts, dedicated to providing a world-class education and fostering a supportive learning environment. With their extensive experience and passion for teaching, they are committed to helping you achieve your academic and career goals.
                </p>
            </div>
        </div>

        <div className={facultyStyles.facultySection}>
             <div className={facultyStyles.facultyContainer}>
                  <div className={facultyStyles.facultyGrid}>
                    {sampleTeachers.map((teacher, index) => (
                     <motion.div
                     key={teacher.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: index * 0.06 }}
                   className={facultyStyles.card}
                   >
                     <div className={facultyStyles.teacherCard}>
                         <div className={facultyStyles.imageContainer}>
                                <div className={facultyStyles.imageWrapper}>
                                    <img src={teacher.image} alt={teacher.name} className={facultyStyles.image} />
                                </div>

                                <div className={facultyStyles.experienceBadge}>
                                    <div className={facultyStyles.experienceBadgeContent}>
                                           {teacher.experience} yrs
                                    </div>
                                </div>
                         </div>

                         <div className={facultyStyles.teacherInfo}>
                             <h3 className={facultyStyles.teacherName}>{teacher.name}</h3>
                             <p className={facultyStyles.teacherQualification}>{teacher.qualification}</p>
                             <p className={facultyStyles.teacherBio}>{teacher.bio}</p>
                         </div>
                     </div>
                   </motion.div>
                    ))}
                  </div>
             </div>

        </div>
      <style jsx>{facultyStyles.animations}</style>
      
    </div>
  )
}

export default FacultyPage