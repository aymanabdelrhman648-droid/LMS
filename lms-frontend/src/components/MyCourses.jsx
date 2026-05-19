import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  myCoursesStyles,
  myCoursesCustomStyles,
} from "../assets/dummyStyles";

import { useNavigate } from "react-router-dom";

import {
  useAuth,
  useUser,
} from "@clerk/clerk-react";

import { toast } from "react-toastify";

import {
  Play,
  Star,
  User,
} from "lucide-react";

const API_BASE = "http://localhost:4000";

const MyCourses = () => {
  const navigate = useNavigate();

  // ✅ FIX
  const { isLoaded, isSignedIn } = useUser();

  const { getToken } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [ratings, setRatings] = useState({});
  const [hoverRatings, setHoverRatings] =
    useState({});

  const hasFetchedRef = useRef(false);
  const isMountedRef = useRef(true);

  // ─────────────────────────────────────────────
  // Auth Headers
  // ─────────────────────────────────────────────
  const getAuthHeaders = useCallback(
    async () => {
      const headers = {
        "Content-Type": "application/json",
      };

      try {
        const token = await getToken();

        console.log("TOKEN:", token);

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.log("TOKEN ERROR:", err);
      }

      return headers;
    },
    [getToken]
  );

  // ─────────────────────────────────────────────
  // Fetch Courses
  // ─────────────────────────────────────────────
  useEffect(() => {
    // ✅ WAIT FOR CLERK
    if (!isLoaded) return;

    isMountedRef.current = true;

    if (hasFetchedRef.current) return;

    hasFetchedRef.current = true;

    const controller = new AbortController();

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSignedIn) {
          setCourses([]);
          setLoading(false);
          return;
        }

        const bookingHeaders =
          await getAuthHeaders();

        console.log(
          "BOOKING HEADERS:",
          bookingHeaders
        );

        const bookingsRes = await fetch(
          `${API_BASE}/api/booking/my`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
            headers: bookingHeaders,
          }
        );

        console.log(
          "BOOKING STATUS:",
          bookingsRes.status
        );

        if (!bookingsRes.ok) {
          throw new Error(
            `Failed to fetch bookings (${bookingsRes.status})`
          );
        }

        const bookingsData =
          await bookingsRes.json();

        console.log(
          "BOOKINGS DATA:",
          bookingsData
        );

       const bookings =
  bookingsData.bookings ||
  bookingsData.data ||
  [];

        // fetch courses
        const combined = await Promise.all(
          bookings.map(async (booking) => {
            const courseId =
              booking.course ||
              booking.courseId;

            if (!courseId) return null;

            try {
              const courseRes = await fetch(
                `${API_BASE}/api/course/${courseId}`,
                {
                  method: "GET",
                  credentials: "include",
                  signal: controller.signal,
                }
              );

              if (!courseRes.ok) {
                return null;
              }

              const courseJson =
                await courseRes.json();

              if (
                !courseJson?.success ||
                !courseJson?.course
              ) {
                return null;
              }

              return {
                booking,
                course: courseJson.course,
              };
            } catch (err) {
              return null;
            }
          })
        );

        if (!isMountedRef.current) return;

        const valid =
          combined.filter(Boolean);

        const uiCourses = valid.map(
          ({ booking, course }) => ({
            booking,

            id:
              course._id ||
              course.id ||
              booking.course ||
              booking.courseId,

            name:
              course.name ||
              booking.courseName ||
              "Untitled Course",

            teacher:
              course.teacher ||
              booking.teacherName ||
              "",

            image: course.image || "",

            avgRating:
              typeof course.avgRating !==
              "undefined"
                ? course.avgRating
                : course.avgRatings || 0,

            totalRatings:
              typeof course.totalRatings !==
              "undefined"
                ? course.totalRatings
                : 0,

            isFree:
              course.pricingType ===
                "free" || !course.price,

            price: course.price || {
              original:
                booking.price || 0,
              sale: booking.price || 0,
            },

            overview:
              course.overview || "",

            lectures:
              course.lectures || [],
          })
        );

        setCourses(uiCourses);

        // ratings
        if (uiCourses.length > 0) {
          const ratingHeaders =
            await getAuthHeaders();

          const ratingResults =
            await Promise.all(
              uiCourses.map(async (c) => {
                try {
                  const res = await fetch(
                    `${API_BASE}/api/course/${c.id}/rating`,
                    {
                      method: "GET",
                      credentials:
                        "include",
                      signal:
                        controller.signal,
                      headers:
                        ratingHeaders,
                    }
                  );

                  const data =
                    await res.json();

                  if (
                    data?.success &&
                    data?.myRating
                  ) {
                    return {
                      courseId: c.id,
                      rating:
                        data.myRating.rating,
                    };
                  }
                } catch (_) {}

                return null;
              })
            );

          if (!isMountedRef.current)
            return;

          const ratingsMap = {};

          ratingResults.forEach((r) => {
            if (r) {
              ratingsMap[r.courseId] =
                r.rating;
            }
          });

          setRatings(ratingsMap);
        }
      } catch (err) {
        console.log(
          "FETCH MY COURSES ERROR:",
          err
        );

        if (
          isMountedRef.current &&
          err.name !== "AbortError"
        ) {
          setError(
            err.message ||
              "Failed to load courses"
          );
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      isMountedRef.current = false;

      controller.abort();
    };

    // ✅ FIX
  }, [
    isLoaded,
    isSignedIn,
    getAuthHeaders,
  ]);

  // reset fetch guard
  useEffect(() => {
    if (!isSignedIn) {
      hasFetchedRef.current = false;
    }
  }, [isSignedIn]);

  // ─────────────────────────────────────────────
  // Submit Rating
  // ─────────────────────────────────────────────
  const submitRatingToServer =
    useCallback(
      async (courseId, ratingValue) => {
        try {
          const headers =
            await getAuthHeaders();

          const res = await fetch(
            `${API_BASE}/api/course/${courseId}/rate`,
            {
              method: "POST",
              credentials: "include",
              headers,
              body: JSON.stringify({
                rating: ratingValue,
              }),
            }
          );

          const data = await res.json();

          if (
            !res.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Failed to rate"
            );
          }

          setCourses((prev) =>
            prev.map((c) =>
              c.id === courseId
                ? {
                    ...c,
                    avgRating:
                      data.avgRating ??
                      c.avgRating,

                    totalRatings:
                      data.totalRatings ??
                      c.totalRatings,
                  }
                : c
            )
          );

          setRatings((prev) => ({
            ...prev,
            [courseId]: ratingValue,
          }));

          toast.success(
            "Thanks for rating!"
          );
        } catch (err) {
          toast.error(
            err.message ||
              "Failed to submit rating"
          );
        }
      },
      [getAuthHeaders]
    );

  const handleRating = useCallback(
    async (e, courseId, newRate) => {
      e.preventDefault();

      e.stopPropagation();

      if (!isSignedIn) {
        toast.error(
          "Please login to submit rating"
        );

        return;
      }

      setRatings((prev) => ({
        ...prev,
        [courseId]: newRate,
      }));

      await submitRatingToServer(
        courseId,
        newRate
      );
    },
    [isSignedIn, submitRatingToServer]
  );

  const handleViewCourse =
    useCallback(
      (courseId) => {
        navigate(`/courses/${courseId}`);
      },
      [navigate]
    );

  // ─────────────────────────────────────────────
  // Stars
  // ─────────────────────────────────────────────
  const renderInteractiveStars =
    useCallback(
      (course) => {
        const userRating =
          ratings[course.id] || 0;

        const hover =
          hoverRatings[course.id] || 0;

        const display =
          hover ||
          userRating ||
          Math.round(
            course.avgRating || 0
          );

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 4,
              }}
            >
              {Array.from({
                length: 5,
              }).map((_, i) => {
                const idx = i + 1;

                const filled =
                  idx <= display;

                return (
                  <button
                    key={idx}
                    onClick={(e) =>
                      handleRating(
                        e,
                        course.id,
                        idx
                      )
                    }
                    onMouseEnter={() =>
                      setHoverRatings(
                        (s) => ({
                          ...s,
                          [course.id]:
                            idx,
                        })
                      )
                    }
                    onMouseLeave={() =>
                      setHoverRatings(
                        (s) => ({
                          ...s,
                          [course.id]: 0,
                        })
                      )
                    }
                    style={{
                      background:
                        "transparent",

                      border: "none",

                      cursor:
                        "pointer",

                      padding: 0,
                    }}
                  >
                    <Star
                      size={16}
                      fill={
                        filled
                          ? "currentColor"
                          : "none"
                      }
                      color={
                        filled
                          ? "#f59e0b"
                          : "#d1d5db"
                      }
                    />
                  </button>
                );
              })}
            </div>

            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {(
                  course.avgRating || 0
                ).toFixed(1)}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                }}
              >
                (
                {course.totalRatings ||
                  0}
                )
              </div>
            </div>
          </div>
        );
      },
      [
        ratings,
        hoverRatings,
        handleRating,
      ]
    );

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className={
          myCoursesStyles.pageContainer
        }
      >
        <div
          className={
            myCoursesStyles.mainContainer
          }
        >
          <h1
            className={
              myCoursesStyles.header
            }
          >
            My Courses
          </h1>

          <p
            className={
              myCoursesStyles.emptyText
            }
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div
        className={
          myCoursesStyles.pageContainer
        }
      >
        <div
          className={
            myCoursesStyles.mainContainer
          }
        >
          <h1
            className={
              myCoursesStyles.header
            }
          >
            My Courses
          </h1>

          <p
            className={
              myCoursesStyles.emptyText
            }
            style={{ color: "red" }}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  // Empty
  if (!courses.length) {
    return (
      <div
        className={
          myCoursesStyles.pageContainer
        }
      >
        <div
          className={
            myCoursesStyles.mainContainer
          }
        >
          <h1
            className={
              myCoursesStyles.header
            }
          >
            My Courses
          </h1>

          <p
            className={
              myCoursesStyles.emptyText
            }
          >
            You haven't purchased any
            courses yet.
          </p>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div
      className={
        myCoursesStyles.pageContainer
      }
    >
      <div
        className={
          myCoursesStyles.mainContainer
        }
      >
        <h1
          className={
            myCoursesStyles.header
          }
        >
          My Courses
        </h1>

        <div className={myCoursesStyles.grid}>
          {courses.map((course) => (
            <div
              key={course.id}
              className={
                myCoursesStyles.courseCard
              }
              onClick={() =>
                handleViewCourse(course.id)
              }
            >
              <div
                className={
                  myCoursesStyles.imageContainer
                }
              >
                <img
                  src={course.image}
                  alt={course.name}
                  className={
                    myCoursesStyles.courseImage
                  }
                />
              </div>

              <div
                className={
                  myCoursesStyles.courseContent
                }
              >
                <h3
                  className={
                    myCoursesStyles.courseName
                  }
                >
                  {course.name}
                </h3>

                <div
                  className={
                    myCoursesStyles.teacherContainer
                  }
                >
                  <User
                    className={
                      myCoursesStyles.teacherIcon
                    }
                  />

                  <span
                    className={
                      myCoursesStyles.teacherText
                    }
                  >
                    {course.teacher}
                  </span>
                </div>

                <div
                  className={
                    myCoursesStyles.ratingContainer
                  }
                >
                  {renderInteractiveStars(
                    course
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    handleViewCourse(
                      course.id
                    );
                  }}
                  className={
                    myCoursesStyles.viewButton
                  }
                >
                  <Play
                    className={
                      myCoursesStyles.buttonIcon
                    }
                  />

                  <span>
                    View Course
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>
        {myCoursesCustomStyles}
      </style>
    </div>
  );
};

export default MyCourses;