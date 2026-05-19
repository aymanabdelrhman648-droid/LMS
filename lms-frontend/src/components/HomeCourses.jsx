import  { useState,useEffect } from 'react'
import { homeCoursesStyles } from '../assets/dummyStyles'
import { useNavigate } from 'react-router-dom'
import { useUser ,useAuth } from '@clerk/clerk-react'
import { Star, User } from 'lucide-react'
import {Slide, toast, ToastContainer} from 'react-toastify';

 const API_BASE = 'http://localhost:4000';
const HomeCourses = () => {
    const navigate = useNavigate();
    const {title  , course:coursefont} = homeCoursesStyles.fonts;
    const [coursesD , setCoursesD] = useState([]);
    const [loading , setLoading] = useState(true);
    const [error , setError] = useState(null);
    const {getToken} = useAuth();
      const {isSignedIn,user} = useUser();
     const [userRatings , setUserRatings] =useState(() =>{
          try {
             const ratings =  localStorage.getItem('courseRatings');
              return ratings ? JSON.parse(ratings) : {};
          }catch{
                return {};
          }
     });
     const [hoverRatings , setHoverRatings] = useState({});
     useEffect(() => {
         localStorage.setItem('courseRatings' , JSON.stringify(userRatings));
     },[userRatings]);
  
    // Fetch courses data from the backend API
    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        fetch(`${API_BASE}/api/course/puplic?home=true&limit=8`)
        .then(async(res) => {
            if(!res.ok){
              const text = await res.text();
              throw new Error(text || 'Failed to fetch courses');
              }
              return res.json();
        })
              .then((json) => {
                console.log(json);
        if (!isMounted) return;
        const items = (json && (json.items || json.courses || [])) || [];
        const mapped = items.map((c) => {
  const rawImage = c.image || "";
  const image = rawImage.startsWith("http")
    ? rawImage
    : `${API_BASE}/${rawImage.replace(/^\/+/, "")}`;
console.log("RAW image:", c.image, "| MAPPED:", image);
  return {
    id: c._id || c.id,
    name: c.name,
    teacher: c.teacher,
    image,
    price: c.price,
    isFree: c.pricingType === "free",
    avgRating: Number(c.avgRatings || 0),
    totalRatings: c.totalRatings ?? c.ratingCount ?? 0,
    courseType: c.courseType || "regular",
  };
});
        console.log(json);
console.log(items);
console.log(mapped);
        setCoursesD(mapped);
    })
    .catch((err) => {
        console.error("Error fetching courses:", err);
        if(isMounted)  setError(err.message || "Failed to load courses");
    })
    .finally(() => {
        if(isMounted) setLoading(false);
    });

    return () => {
        isMounted = false;
    };
  
  },[]);

     const handlecourseClick = (id) => {
          const token = localStorage.getItem('token');
          if(!token){
            showtoastlogin();
            return;
          }
            navigate(`/course/${id}`);
     }
     
     const showtoastlogin = () => {
         toast.error("Please login to access the course details!", {
            position: "top-right",
            autoClose: 3000,
            transition :  Slide,
            theme: "dark",
         });
     };

     const handlebrowse = () => {
         const token = localStorage.getItem('token');
            if(!token){
                showtoastlogin();
                return;
            }
            navigate('/courses');
     }

   const submitRatingToServer = async (courseId, ratingValue) => {
    try {
      const headers = { "Content-Type": "application/json" };
      // try to get Clerk JWT token if available (works with Clerk)
      try {
        if (getToken) {
          const token = await getToken().catch(() => null);
          if (token) headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        // ignore token errors and fall back to credentials include
      }

      const res = await fetch(`${API_BASE}/api/course/${courseId}/rate`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ rating: ratingValue }),
      });
      const data = await res.json().catch(() => ({ success: false }));
      if (!res.ok && !data.success) {
        const msg =
          (data && (data.message || data.error)) ||
          `Failed to rate (${res.status})`;
        throw new Error(msg);
      }

      // Expect server to return new avg & total (controller examples above do)
      // Some servers return { success: true, avgRating, totalRatings }
      const avg =
        data.avgRating ??
        data.course?.avgRating ??
        data.course?.avgRating ??
        data.course?.avgRating ??
        data.course?.avgRating;
      const total =
        data.totalRatings ??
        data.course?.ratingCount ??
        data.course?.ratingCount ??
        data.course?.ratingCount;

      // update UI with returned aggregates (fallback to previous if missing)
      setCoursesD((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                avgRating: typeof avg === "number" ? avg : c.avgRating,
                totalRatings:
                  typeof total === "number" ? total : c.totalRatings,
              }
            : c
        )
      );

      // store user's rating locally so UI reflects selection
      setUserRatings((prev) => ({ ...prev, [courseId]: ratingValue }));

      toast.success("Thanks for your rating!");
      return { success: true, avg, total };
    } catch (err) {
      console.error("submitRatingToServer:", err);
      toast.error(err.message || "Failed to submit rating");
      return { success: false, error: err };
    }
  };
     

     const handleSetRating =async (e , courseId , rating) => {
            e.stopPropagation();
            if(!isSignedIn){
                toast("Please sign in to rate the course!", {
                    icon: <Star size={16} />
                });
                return;
            }
            setUserRatings((prev) => ({...prev , [courseId]: rating}));
            await submitRatingToServer(courseId, rating);
        }

        
    const renderInteractiveStars = (course) => {
    // if signed in and user rated, show their rating; otherwise show rounded avg
    const userRating = userRatings[course.id] || 0;
    const hover = hoverRatings[course.id] || 0;
    // when logged in prefer user's rating for filled stars, else show rounded avg
    const baseDisplay = userRating || Math.round(course.avgRating || 0);
    const displayRating = hover || baseDisplay;

    return (
      <div
        className={homeCoursesStyles.starsContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={homeCoursesStyles.interactiveStars}>
          {Array.from({ length: 5 }).map((_, i) => {
            const idx = i + 1;
            const filled = idx <= displayRating;
            return (
              <button
                key={i}
                aria-label={`Rate ${idx} star${idx > 1 ? "s" : ""}`}
                onClick={(e) => handleSetRating(e, course.id, idx)}
                onMouseEnter={() =>
                  setHoverRatings((s) => ({ ...s, [course.id]: idx }))
                }
                onMouseLeave={() =>
                  setHoverRatings((s) => ({ ...s, [course.id]: 0 }))
                }
                className={`${homeCoursesStyles.starButton} ${
                  filled
                    ? homeCoursesStyles.starButtonActive
                    : homeCoursesStyles.starButtonInactive
                }`}
                style={{ background: "transparent" }}
              >
                <Star
                  size={16}
                  fill={filled ? "currentColor" : "none"}
                  stroke="currentColor"
                  className={homeCoursesStyles.starIcon}
                />
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginLeft: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontWeight: 600 }}>
            {(course.avgRating || 0).toFixed(1)}
          </span>
          <span style={{ color: "#6b7280", fontSize: 12 }}>
            ({course.totalRatings || 0})
          </span>
        </div>
      </div>
    );
  };
  return (
    <div className={homeCoursesStyles.container}>
          <div className={homeCoursesStyles.mainContainer}>
                 <div className={homeCoursesStyles.header}>
                    <h2 className={`${title} ${homeCoursesStyles.title}`}>
                         <Star className={homeCoursesStyles.titleIcon}/>
                         Explore Our Top Courses
                         <Star className={homeCoursesStyles.titleIcon}/>
                    </h2>
               </div>

               {loading ? (
                   <div className='p-6 text-center'>
                        Loading courses...
                     </div>
               ) : error ? (
                    <div className='p-6 text-center text-red-500'>
                        {error}
                    </div>
                ) : 
                   <>
                   
                      <div className={homeCoursesStyles.coursesGrid}>
                     {
                        coursesD.map((course,i) => {
                            const isfree = !!course.isFree || !course.price;
                            const {id , price , image , name} = course;
                            
                            return (
                                <div key={i} className={homeCoursesStyles.courseCard} 
                                onClick={() => handlecourseClick(id)}>
                                   <div className={homeCoursesStyles.imageContainer}> 
                                      <img src={image} 
                                       alt={name}
                                       className={homeCoursesStyles.courseImage}
                                       loading='lazy'
                                        />
                                    </div>
                                      <div className={homeCoursesStyles.courseInfo}>
                                        <h3 className={`${homeCoursesStyles.courseName} ${coursefont}`}>{name}</h3>
                                        <div className={homeCoursesStyles.teacherInfo}>
                                              <User size={15} className={homeCoursesStyles.teacherIcon}/>
                                              <span className={homeCoursesStyles.teacherName}>
                                                {course.teacher}
                                              </span>
                                        </div>
                                        </div>
                                        <div className={homeCoursesStyles.ratingContainer}>
                                              {renderInteractiveStars(course)}
                                        </div>
                                        <div className={homeCoursesStyles.pricingContainer}>
                                              {isfree ? (
                                                <span className={homeCoursesStyles.freeLabel}>Free</span>
                                              ) : (
                                                <>
                                                 <span className={homeCoursesStyles.salePrice}>${price.sale}</span>
                                                </>
                                              
                                              )}
                                        </div>
                                        
                                      </div>
                                     
                               
                            )
                        })
                     }
                     
               </div>
                  </>
                }
          
          </div>
          <ToastContainer
          autoClose={3000}
          position="top-right"
          transition={Slide}
          theme="dark"
          />  
         <style jsx>{}</style>
    </div>
  )
}

export default HomeCourses