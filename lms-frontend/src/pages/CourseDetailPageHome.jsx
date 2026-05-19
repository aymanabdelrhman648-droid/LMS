import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  Clock,
  BookOpen,
  ChevronDown,
  CheckCircle,
  Circle,
  X,
  ArrowLeft,
  User,
  Award,
  Target,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  courseDetailStylesH,
  toastStyles,
  animationDelaysH,
  courseDetailCustomStyles,
} from "../assets/dummyStyles";

import { useUser, useAuth } from "@clerk/clerk-react";

const API_BASE = "http://localhost:4000";

const fmtMinutes = (mins) => {
  const h = Math.floor((mins || 0) / 60);
  const m = (mins || 0) % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const Toast = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`${toastStyles.toast} ${
        type === "error" ? toastStyles.toastError : toastStyles.toastInfo
      }`}
    >
      <div className={toastStyles.toastContent}>
        <span>{message}</span>
        <button onClick={onClose} className={toastStyles.toastClose}>
          <X className={toastStyles.toastCloseIcon} />
        </button>
      </div>
    </div>
  );
};

/* helpers for video URLs */
const toEmbedUrl = (url) => {
  if (!url) return "";
  try {
    const trimmed = String(url).trim();
    if (/\/embed\//.test(trimmed)) return trimmed;
    const watchMatch = trimmed.match(/[?&]v=([^&#]+)/);
    if (watchMatch && watchMatch[1])
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    const shortMatch = trimmed.match(/youtu\.be\/([^?&#/]+)/);
    if (shortMatch && shortMatch[1])
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    const lastSeg = trimmed.split("/").filter(Boolean).pop();
    if (lastSeg && lastSeg.length === 11)
      return `https://www.youtube.com/embed/${lastSeg}`;
    return trimmed;
  } catch (e) {
    return url;
  }
};

const appendAutoplay = (embedUrl, autoplay = true) => {
  if (!embedUrl) return "";
  if (!autoplay) return embedUrl;
  return embedUrl.includes("?")
    ? `${embedUrl}&autoplay=1`
    : `${embedUrl}?autoplay=1`;
};

const normalizeCourse = (c) => {
  if (!c) return c;
  const course = { ...c };
  course.lectures = Array.isArray(course.lectures)
    ? course.lectures.map((l) => {
        const lecture = { ...l };
        lecture.durationMin =
          lecture.durationMin ??
          lecture.totalMinutes ??
          (lecture.duration?.hours || 0) * 60 +
            (lecture.duration?.minutes || 0);
          lecture.chapters = Array.isArray(lecture.chapters)
          ? lecture.chapters.map((ch) => {
              const chapter = { ...ch };
              chapter.durationMin =
                chapter.durationMin ??
                chapter.totalMinutes ??
                (chapter.duration?.hours || 0) * 60 +
                  (chapter.duration?.minutes || 0);
              return chapter;
            })
          : [];
        return lecture;
      })
    : [];
  return course;
};

const CourseDetailHomePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const courseId = id;

  const { user } = useUser();
  const { getToken } = useAuth();
  const isLoggedIn = Boolean(user);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEnrolled, setIsEnrolled] = useState(false); 
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [bookingInfo, setBookingInfo] = useState(null);

  const [toast, setToast] = useState(null);
  const [expandedLectures, setExpandedLectures] = useState(new Set());
  const [completedChapters, setCompletedChapters] = useState(new Set());
  const [isTeacherAnimating, setIsTeacherAnimating] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const studentNameFromUser = useMemo(() => {
    if (!user) return "";
    const fullName =
      user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const email =
      user.primaryEmailAddress?.emailAddress ||
      (user.emailAddresses && user.emailAddresses[0]?.emailAddress) ||
      "";
    return fullName || email || "";
  }, [user]);

  const studentEmailFromUser = useMemo(() => {
    if (!user) return "";
    return (
      user.primaryEmailAddress?.emailAddress ||
      (user.emailAddresses && user.emailAddresses[0]?.emailAddress) ||
      ""
    );
  }, [user]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/course/${courseId}`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to fetch course ${courseId}`);
        }
        return res.json();
      })
      .then((json) => {
        if (!mounted) return;
        if (!json || !json.success) {
          throw new Error((json && json.message) || "Failed to load course");
        }
        const normalized = normalizeCourse(json.course);
        setCourse(normalized);
      })
      .catch((err) => {
        console.error("Failed to load course:", err);
        if (mounted) setError(err.message || "Failed to load course");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [courseId]);

  useEffect(() => {
    let mounted = true;
    if (!course) return;

    const checkEnrollment = async () => {
      try {
        let headers = { "Content-Type": "application/json" };
        let opts = { method: "GET" };
        if (getToken) {
          try {
            const token = await getToken({ template: "standard" }).catch(() =>
              getToken()
            );
            if (token) {
              headers.Authorization = `Bearer ${token}`;
              opts = { method: "GET", headers };
            } else {
              opts = { method: "GET", credentials: "include", headers };
            }
          } catch (e) {
            opts = { method: "GET", credentials: "include", headers };
          }
        } else {
          opts = { method: "GET", credentials: "include", headers };
        }

        const q = `${API_BASE}/api/booking/check?courseId=${encodeURIComponent(
          course._id ?? course.id ?? courseId
        )}`;
        const res = await fetch(q, opts);
        const data = await res.json().catch(() => ({}));

        let serverBooking =
          data.booking || data.bookingRecord || data.data || null;
        if (!serverBooking && data.sessionBooking)
          serverBooking = data.sessionBooking;

        const serverSaysEnrolled =
          data.enrolled ||
          data.userEnrolled ||
          data.alreadyBooked ||
          data.bookingExists;

        const bookingPaidOrConfirmed =
          serverBooking &&
          (serverSaysEnrolled ||
            serverBooking.paymentStatus === "Paid" ||
            serverBooking.paymentStatus === "paid" ||
            serverBooking.orderStatus === "Confirmed" ||
            serverBooking.orderStatus === "confirmed" ||
            !!serverBooking.paidAt);

        if (mounted && bookingPaidOrConfirmed) {
          setBookingInfo(serverBooking || null);
          setIsEnrolled(true);
          return;
        }

        if (mounted && serverBooking) {
          setBookingInfo(serverBooking);
          setIsEnrolled(false);
          return;
        }

        if (mounted) {
          setBookingInfo(null);
          setIsEnrolled(false);
        }
      } catch (err) {
        console.debug("booking.check failed:", err);
        // keep previous state (do not flip)
      }
    };

    checkEnrollment();
    return () => (mounted = false);
  }, [course, isLoggedIn, getToken, courseId]);

  useEffect(() => {
    setIsTeacherAnimating(true);
    const timer = setTimeout(() => setIsTeacherAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [course]);

  useEffect(() => setIsPageLoaded(true), []);

  const [selectedContent, setSelectedContent] = useState({
    type: "lecture",
    lectureId: null,
    chapterId: null,
  });

  const selectedLecture = useMemo(() => {
    if (!selectedContent.lectureId || !course) return null;
    return (
      (course.lectures || []).find(
        (l) =>
          String(l.id) === String(selectedContent.lectureId) ||
          String(l._id) === String(selectedContent.lectureId)
      ) || null
    );
  }, [course, selectedContent.lectureId]);

  const selectedChapter = useMemo(() => {
    if (!selectedContent.chapterId || !selectedLecture) return null;
    return (
      (selectedLecture.chapters || []).find(
        (ch) =>
          String(ch.id) === String(selectedContent.chapterId) ||
          String(ch._id) === String(selectedContent.chapterId)
      ) || null
    );
  }, [selectedLecture, selectedContent.chapterId]);

  const currentVideoContent = useMemo(() => {
    if (selectedContent.type === "chapter" && selectedChapter)
      return selectedChapter;
    if (selectedContent.type === "lecture" && selectedLecture)
      return selectedLecture;
    return null;
  }, [selectedContent, selectedLecture, selectedChapter]);

  const totalMinutes = useMemo(
    () =>
      (course?.lectures || []).reduce(
        (sum, l) => sum + (l.durationMin || l.totalMinutes || 0),
        0
      ),
    [course]
  );

  const priceObj = course?.price;
  const hasPriceObj = !!(
    priceObj &&
    (priceObj.sale != null || priceObj.original != null)
  );
  const salePrice =
    hasPriceObj && priceObj.sale != null ? Number(priceObj.sale) : null;
  const originalPrice =
    hasPriceObj && priceObj.original != null ? Number(priceObj.original) : null;
  const formatCurrency = (n) => (n == null || Number.isNaN(n) ? "" : `₹${n}`);
  const hasDiscount =
    originalPrice != null && salePrice != null && originalPrice > salePrice;
  const courseIsFree = course
    ? !!course.isFree ||
      !course.price ||
      (!course.price.sale && !course.price.original) ||
      course.pricingType === "free"
    : true;

  const toggleLecture = (lectureId) => {
    setExpandedLectures((prev) => {
      const next = new Set(prev);
      if (next.has(lectureId)) next.delete(lectureId);
      else next.add(lectureId);
      return next;
    });
  };

  const handleContentSelect = (lectureId, chapterId = null) => {
    if (isLoggedIn && isEnrolled) {
      setSelectedContent({
        type: chapterId ? "chapter" : "lecture",
        lectureId,
        chapterId,
      });
      setExpandedLectures((prev) =>
        prev.has(lectureId) ? new Set(prev) : new Set([...prev, lectureId])
      );
      return;
    }
    if (!isLoggedIn) {
      setToast({
        message: "Please login to access course content",
        type: "error",
      });
      return;
    }
    if (!isEnrolled && bookingInfo && bookingInfo.price > 0) {
      // booking exists but unpaid
      setToast({
        message:
          "You have a pending payment for this course. Complete payment to access content.",
        type: "error",
      });
      return;
    }
    setToast({
      message: "Please enroll in the course to access content",
      type: "error",
    });
    return;
  };

  const onLectureHeaderClick = (lectureId) => {
    const isOpen = expandedLectures.has(lectureId);
    if (isOpen) {
      setExpandedLectures((prev) => {
        const next = new Set(prev);
        next.delete(lectureId);
        return next;
      });
      if (selectedContent.lectureId === lectureId) {
        setSelectedContent({
          type: "lecture",
          lectureId: null,
          chapterId: null,
        });
      }
      return;
    }
    if (!isEnrolled) {
      if (!isLoggedIn) {
        setToast({ message: "Please login to view chapters", type: "error" });
      } else if (
        bookingInfo &&
        bookingInfo.price > 0 &&
        (bookingInfo.paymentStatus === "Unpaid" ||
          bookingInfo.paymentStatus === "unpaid")
      ) {
        setToast({
          message: "Payment pending. Complete payment to view chapters.",
          type: "error",
        });
      } else {
        setToast({ message: "Please enroll to view chapters", type: "error" });
      }
      return;
    }
    setExpandedLectures((prev) => new Set([...prev, lectureId]));
    handleContentSelect(lectureId, null);
  };

  const toggleChapterCompletion = (chapterId, e) => {
    if (e) e.stopPropagation();
    if (!isLoggedIn || !isEnrolled) {
      setToast({
        message: "Please enroll and login to track progress",
        type: "error",
      });
      return;
    }
    setCompletedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  // create or complete booking (enroll)
  const handleEnroll = async () => {
    if (!isLoggedIn) {
      setToast({
        message: "Please login to enroll in the course",
        type: "error",
      });
      return;
    }
    if (!course) {
      setToast({ message: "Course not loaded", type: "error" });
      return;
    }

    if (isEnrolled) {
      setToast({
        message: "You are already enrolled in this course.",
        type: "info",
      });
      return;
    }

    setIsEnrolling(true);
    try {
      const numericPrice =
        salePrice != null
          ? salePrice
          : originalPrice != null
          ? originalPrice
          : 0;
      const studentName = studentNameFromUser || "";
      const email = studentEmailFromUser || "";

      const payload = {
        courseId: course._id ?? course.id ?? courseId,
        courseName: course.name,
        teacherName: course.teacher || "",
        price: numericPrice,
        studentName,
        email,
      };

      let headers = { "Content-Type": "application/json" };
      let opts = {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        credentials: "include",
      };

      if (getToken) {
        try {
          const token = await getToken().catch(() => null);
          if (token) {
            headers.Authorization = `Bearer ${token}`;
            opts = {
              method: "POST",
              headers,
              body: JSON.stringify(payload),
            };
          }
        } catch (e) {
          // keep credentials include fallback
        }
      }

      const res = await fetch(`${API_BASE}/api/booking/create`, opts);
      const data = await res.json().catch(() => ({ success: false }));

      if (!res.ok || !data.success) {
        const msg =
          (data && (data.message || data.error)) ||
          `Failed to create booking (${res.status})`;
        const alreadyBooked =
          /already booked|already enrolled|booking exists/i.test(msg) ||
          data.alreadyBooked ||
          data.bookingExists;
        if (alreadyBooked) {
          // Re-run server-side check to get booking state
          setToast({
            message:
              "You already have a booking for this course. Checking status...",
            type: "info",
          });
          try {
            const q = `${API_BASE}/api/booking/check?courseId=${encodeURIComponent(
              payload.courseId
            )}`;
            const checkOpts =
              opts.method === "POST"
                ? { method: "GET", headers: opts.headers }
                : { method: "GET", credentials: "include" };
            const chkRes = await fetch(q, checkOpts);
            const chkData = await chkRes.json().catch(() => ({}));
            if (chkData.booking) setBookingInfo(chkData.booking);
            // if server claims enrolled -> set
            if (
              chkData.enrolled ||
              chkData.userEnrolled ||
              chkData.bookingExists ||
              chkData.alreadyBooked
            ) {
              setIsEnrolled(true);
              setToast({ message: "You're enrolled.", type: "info" });
            } else {
              // if booking exists but unpaid
              if (chkData.booking)
                setToast({
                  message: "Booking found — payment pending.",
                  type: "info",
                });
            }
          } catch (e) {
            console.debug("re-check after alreadyBooked:", e);
          }
          return;
        }
        throw new Error(msg);
      }

      // If checkout is required (Stripe) — redirect the user
      if (data.checkoutUrl) {
        // Keep bookingInfo if server returned booking
        if (data.booking) setBookingInfo(data.booking);
        window.location.href = data.checkoutUrl;
        return;
      }

      // If server returned booking (free course or immediate confirmed)
      if (data.booking) {
        setBookingInfo(data.booking);
        // determine paid/confirmed
        const b = data.booking;
        const paid =
          b.paymentStatus === "Paid" ||
          b.paymentStatus === "paid" ||
          b.orderStatus === "Confirmed" ||
          b.orderStatus === "confirmed" ||
          !!b.paidAt;

        if (paid) {
          setIsEnrolled(true);
          setToast({
            message:
              numericPrice === 0
                ? "Enrolled successfully (free course)."
                : "Enrollment succeeded.",
            type: "info",
          });
          // for a paid course that was marked paid by server, navigate to My Courses
          if (numericPrice > 0) {
            navigate("/my-courses");
          }
          return;
        }

        // booking exists but unpaid (pending payment)
        if (numericPrice > 0 && !paid) {
          setIsEnrolled(false);
          setToast({
            message: "Booking created — complete payment to access the course.",
            type: "info",
          });
          return;
        }

        // fallback: mark enrolled
        setIsEnrolled(true);
        setToast({ message: "Enrolled.", type: "info" });
        return;
      }

      // if no booking returned but success true — assume enrolled for free courses
      if (data.success) {
        if (numericPrice === 0) {
          setIsEnrolled(true);
          setToast({ message: "Enrolled (free course).", type: "info" });
        } else {
          setToast({
            message: "Enrollment initiated, complete payment.",
            type: "info",
          });
        }
      }
    } catch (err) {
      console.error("Enroll error:", err);
      setToast({ message: err.message || "Enrollment failed", type: "error" });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleBackToHome = () => navigate("/");

  if (loading) return <div className="p-6 text-center">Loading course...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  if (!course) {
    return (
      <div className={courseDetailStylesH.notFoundContainer}>
        <div className={courseDetailStylesH.notFoundPattern}>
          <div
            className={`${courseDetailStylesH.notFoundBlob} top-10 left-10 bg-purple-300`}
          />
          <div
            className={`${courseDetailStylesH.notFoundBlob} top-10 right-10 bg-yellow-300 ${animationDelaysH.delay2000}`}
          />
          <div
            className={`${courseDetailStylesH.notFoundBlob} bottom-10 left-20 bg-pink-300 ${animationDelaysH.delay400}`}
          ></div>
        </div>
        <div className={courseDetailStylesH.notFoundContent}>
          <h2 className={courseDetailStylesH.notFoundTitle}>
            Course not found
          </h2>
          <p className={courseDetailStylesH.notFoundText}>
            Go back to courses list
          </p>
          <button
            onClick={() => navigate("/courses")}
            className={courseDetailStylesH.notFoundButton}
          >
            Back to courses
          </button>
        </div>
      </div>
    );
  }

  // derive UI state for pricing button:
  const bookingPendingPayment =
    bookingInfo &&
    (bookingInfo.paymentStatus === "Unpaid" ||
      bookingInfo.paymentStatus === "unpaid") &&
    (salePrice || originalPrice || bookingInfo.price) > 0;

  return (
    <div className={courseDetailStylesH.pageContainer}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div
        className={`${courseDetailStylesH.mainContainer} ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToHome}
            className={courseDetailStylesH.backButton}
          >
            <ArrowLeft className={courseDetailStylesH.backButtonIcon} />
            <span className={courseDetailStylesH.backButtonText}>
              Back to Home
            </span>
          </button>

          {/* refresh booking button intentionally removed */}
          <div />
        </div>

        <div className={courseDetailStylesH.headerContainer}>
          <div className={courseDetailStylesH.courseBadge}>
            <BookOpen className={courseDetailStylesH.badgeIcon} />
            <span className={courseDetailStylesH.badgeText}>
              {courseIsFree ? "Free Course" : "Premium Course"}
            </span>
          </div>

          <h1 className={courseDetailStylesH.courseTitle}>{course.name}</h1>

          {course.overview && (
            <div className={courseDetailStylesH.overviewContainer}>
              <div className={courseDetailStylesH.overviewCard}>
                <div className={courseDetailStylesH.overviewHeader}>
                  <Target className={courseDetailStylesH.overviewIcon} />
                  <h3 className={courseDetailStylesH.overviewTitle}>
                    Course Overview
                  </h3>
                </div>
                <p className={courseDetailStylesH.overviewText}>
                  {course.overview}
                </p>
              </div>
            </div>
          )}

          <div
            className={`${courseDetailStylesH.statsContainer} ${animationDelaysH.delay300}`}
          >
            <div className={courseDetailStylesH.statItem}>
              <Clock className={courseDetailStylesH.statIcon} />
              <span className={courseDetailStylesH.statText}>
                {fmtMinutes(totalMinutes)}
              </span>
            </div>
            <div className={courseDetailStylesH.statItem}>
              <BookOpen className={courseDetailStylesH.statIcon} />
              <span className={courseDetailStylesH.statText}>
                {(course.lectures || []).length} lectures
              </span>
            </div>

            <div
              className={`${courseDetailStylesH.teacherStat} ${
                isTeacherAnimating ? "scale-110 bg-indigo-100/50" : ""
              }`}
            >
              <User className={courseDetailStylesH.teacherIcon} />
              <span className={courseDetailStylesH.teacherText}>
                {course.teacher}
              </span>
            </div>
          </div>
        </div>

        <div className={courseDetailStylesH.mainGrid}>
          <div className={courseDetailStylesH.videoSection}>
            <div className={courseDetailStylesH.videoContainer}>
              <div className={courseDetailStylesH.videoWrapper}>
                {currentVideoContent?.videoUrl ? (
                  <iframe
                    title={
                      currentVideoContent.title || currentVideoContent.name
                    }
                    src={appendAutoplay(
                      toEmbedUrl(currentVideoContent.videoUrl),
                      isLoggedIn && isEnrolled
                    )}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={courseDetailStylesH.videoFrame}
                  />
                ) : (
                  <div className={courseDetailStylesH.videoPlaceholder}>
                    <div
                      className={courseDetailStylesH.videoPlaceholderPattern}
                    >
                      <div
                        className={`${courseDetailStylesH.videoPlaceholderBlob} top-1/4 left-1/4 bg-purple-500`}
                      />
                      <div
                        className={`${courseDetailStylesH.videoPlaceholderBlob} bottom-1/4 right-1/4 bg-blue-500`}
                      />
                    </div>
                    <div
                      className={courseDetailStylesH.videoPlaceholderContent}
                    >
                      <div className={courseDetailStylesH.videoPlaceholderIcon}>
                        <Play
                          className={
                            courseDetailStylesH.videoPlaceholderPlayIcon
                          }
                        />
                      </div>
                      <p className={courseDetailStylesH.videoPlaceholderText}>
                        Select a lecture or chapter to play video
                      </p>
                      {!isLoggedIn || !isEnrolled ? (
                        <p
                          className={
                            courseDetailStylesH.videoPlaceholderSubtext
                          }
                        >
                          {!isLoggedIn
                            ? "Login required"
                            : bookingPendingPayment
                            ? "Payment pending"
                            : "Enrollment required"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <div className={courseDetailStylesH.videoInfo}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={courseDetailStylesH.videoTitle}>
                      {currentVideoContent?.title ||
                        currentVideoContent?.name ||
                        "Select content to play"}
                    </h3>
                    <p className={courseDetailStylesH.videoDescription}>
                      {selectedContent.type === "chapter"
                        ? `Part of: ${selectedLecture?.title}`
                        : currentVideoContent?.description}
                    </p>
                    {currentVideoContent?.durationMin && (
                      <div className={courseDetailStylesH.videoMeta}>
                        <div className={courseDetailStylesH.durationBadge}>
                          <Clock className={courseDetailStylesH.durationIcon} />
                          <span>
                            {fmtMinutes(currentVideoContent.durationMin)}
                          </span>
                        </div>
                        {selectedContent.type === "chapter" && (
                          <span className={courseDetailStylesH.chapterBadge}>
                            Chapter
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isLoggedIn && isEnrolled && selectedContent.chapterId && (
                  <div className={courseDetailStylesH.completionSection}>
                    <button
                      onClick={() =>
                        toggleChapterCompletion(selectedContent.chapterId)
                      }
                      className={`${courseDetailStylesH.completionButton} ${
                        completedChapters.has(selectedContent.chapterId)
                          ? courseDetailStylesH.completionButtonCompleted
                          : courseDetailStylesH.completionButtonIncomplete
                      }`}
                    >
                      {completedChapters.has(selectedContent.chapterId) ? (
                        <>
                          <CheckCircle
                            className={courseDetailStylesH.completionIcon}
                          />
                          Chapter Completed
                        </>
                      ) : (
                        <>
                          <Circle
                            className={courseDetailStylesH.completionIcon}
                          />
                          Mark as Complete
                        </>
                      )}
                    </button>
                    <p className={courseDetailStylesH.completionText}>
                      {completedChapters.has(selectedContent.chapterId)
                        ? "Great job! You've completed this chapter."
                        : "Click to mark this chapter as completed."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className={courseDetailStylesH.sidebar}>
            <div
              className={`${courseDetailStylesH.sidebarCard} ${animationDelaysH.delay200}`}
            >
              <div className={courseDetailStylesH.contentHeader}>
                <h4 className={courseDetailStylesH.contentTitle}>
                  Course Content
                </h4>
                {courseIsFree && (
                  <div className={courseDetailStylesH.freeAccessBadge}>
                    <Sparkles className={courseDetailStylesH.freeAccessIcon} />
                    Free Access
                  </div>
                )}
              </div>

              <div className={courseDetailStylesH.contentList}>
                {(course.lectures || []).map((lecture, index) => (
                  <div
                    key={lecture.id ?? lecture._id ?? index}
                    className={courseDetailStylesH.lectureItem}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`${courseDetailStylesH.lectureHeader} ${
                        expandedLectures.has(lecture.id ?? lecture._id)
                          ? courseDetailStylesH.lectureHeaderExpanded
                          : courseDetailStylesH.lectureHeaderNormal
                      }`}
                      onClick={() =>
                        onLectureHeaderClick(lecture.id ?? lecture._id)
                      }
                    >
                      <div className={courseDetailStylesH.lectureContent}>
                        <div className={courseDetailStylesH.lectureLeft}>
                          <div
                            className={`${courseDetailStylesH.lectureChevron} ${
                              expandedLectures.has(lecture.id ?? lecture._id)
                                ? courseDetailStylesH.lectureChevronExpanded
                                : courseDetailStylesH.lectureChevronNormal
                            }`}
                          >
                            <ChevronDown className="w-5 h-5" />
                          </div>
                          <div className={courseDetailStylesH.lectureInfo}>
                            <div className={courseDetailStylesH.lectureTitle}>
                              {lecture.title}
                            </div>
                            <div className={courseDetailStylesH.lectureMeta}>
                              <div
                                className={courseDetailStylesH.lectureDuration}
                              >
                                <Clock
                                  className={
                                    courseDetailStylesH.lectureDurationIcon
                                  }
                                />
                                {fmtMinutes(lecture.durationMin)}
                              </div>
                              <span
                                className={
                                  courseDetailStylesH.lectureChaptersCount
                                }
                              >
                                {lecture.chapters?.length || 0} chapters
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {expandedLectures.has(lecture.id ?? lecture._id) && (
                      <div className={courseDetailStylesH.chaptersList}>
                        {(lecture.chapters || []).map((chapter) => {
                          const chapId = chapter.id ?? chapter._id;
                          const isCompleted = completedChapters.has(chapId);
                          const isSelected =
                            String(selectedContent.chapterId) ===
                              String(chapId) &&
                            String(selectedContent.lectureId) ===
                              String(lecture.id ?? lecture._id);
                          return (
                            <div
                              key={chapId}
                              className={`${courseDetailStylesH.chapterItem} ${
                                isSelected
                                  ? courseDetailStylesH.chapterItemSelected
                                  : courseDetailStylesH.chapterItemNormal
                              }`}
                              onClick={() =>
                                handleContentSelect(
                                  lecture.id ?? lecture._id,
                                  chapId
                                )
                              }
                            >
                              <div
                                className={courseDetailStylesH.chapterContent}
                              >
                                <div
                                  className={courseDetailStylesH.chapterLeft}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleChapterCompletion(chapId, e);
                                    }}
                                    className={`${
                                      courseDetailStylesH.chapterCompletionButton
                                    } ${
                                      isCompleted
                                        ? courseDetailStylesH.chapterCompletionCompleted
                                        : courseDetailStylesH.chapterCompletionNormal
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle className="w-5 h-5" />
                                    ) : (
                                      <Circle className="w-5 h-5" />
                                    )}
                                  </button>
                                  <div
                                    className={courseDetailStylesH.chapterInfo}
                                  >
                                    <div
                                      className={`${
                                        courseDetailStylesH.chapterName
                                      } ${
                                        isSelected
                                          ? courseDetailStylesH.chapterNameSelected
                                          : courseDetailStylesH.chapterNameNormal
                                      }`}
                                    >
                                      {chapter.name}
                                    </div>
                                    <div
                                      className={
                                        courseDetailStylesH.chapterTopic
                                      }
                                    >
                                      {chapter.topic}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={
                                      courseDetailStylesH.chapterDuration
                                    }
                                  >
                                    {fmtMinutes(chapter.durationMin)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`${courseDetailStylesH.sidebarCard} ${animationDelaysH.delay200}`}
            >
              <div className={courseDetailStylesH.pricingHeader}>
                <h5 className={courseDetailStylesH.pricingTitle}>Pricing</h5>
              </div>
              <div className={courseDetailStylesH.pricingAmount}>
                <div className={courseDetailStylesH.pricingCurrent}>
                  {salePrice != null
                    ? formatCurrency(salePrice)
                    : originalPrice != null
                    ? formatCurrency(originalPrice)
                    : "Free"}
                </div>
                {hasDiscount && (
                  <div className={courseDetailStylesH.pricingOriginal}>
                    {formatCurrency(originalPrice)}
                  </div>
                )}
                {hasDiscount && (
                  <div className={courseDetailStylesH.pricingDiscount}>
                    {Math.round(
                      ((originalPrice - salePrice) / originalPrice) * 100
                    )}
                    % off
                  </div>
                )}
              </div>
              <p className={courseDetailStylesH.pricingDescription}>
                {courseIsFree
                  ? "Free access · Learn anytime (enroll to unlock)"
                  : "One-time payment · Lifetime access · 30-day guarantee"}
              </p>

              <div className="mt-6">
                {/* If booking exists and unpaid -> show a "Complete payment" / "View payment" CTA */}
                {bookingPendingPayment ? (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        // attempt to create/refresh checkout by calling handleEnroll again
                        handleEnroll();
                      }}
                      className={courseDetailStylesH.enrollButton}
                      disabled={isEnrolling}
                    >
                      {isEnrolling ? (
                        <>
                          <div className={courseDetailStylesH.enrollSpinner} />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Play
                            className={courseDetailStylesH.enrollButtonIcon}
                          />
                          Complete Payment
                          <span className="ml-auto opacity-80 group-hover:opacity-100">
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => navigate("/my-courses")}
                      className="text-sm underline"
                    >
                      View booking (My Courses)
                    </button>
                  </div>
                ) : !isEnrolled ? (
                  <button
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    className={courseDetailStylesH.enrollButton}
                  >
                    {isEnrolling ? (
                      <>
                        <div className={courseDetailStylesH.enrollSpinner} />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <Play
                          className={courseDetailStylesH.enrollButtonIcon}
                        />
                        {courseIsFree ? "Enroll (Free)" : "Enroll Now"}
                        <span className="ml-auto opacity-80 group-hover:opacity-100">
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className={courseDetailStylesH.enrollButtonEnrolled}
                  >
                    <CheckCircle
                      className={courseDetailStylesH.enrollButtonIcon}
                    />
                    Enrolled
                  </button>
                )}
              </div>
            </div>

            <div
              className={`${courseDetailStylesH.sidebarCard} ${animationDelaysH.delay400}`}
            >
              <div className={courseDetailStylesH.progressHeader}>
                <Award className={courseDetailStylesH.progressIcon} />
                <h5 className={courseDetailStylesH.progressTitle}>
                  Your Progress
                </h5>
              </div>
              <div className={courseDetailStylesH.progressSection}>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Course Completion</span>
                    <span className="font-semibold text-indigo-600">
                      {Math.round(
                        (completedChapters.size /
                          (course.lectures?.flatMap((l) => l.chapters || [])
                            .length || 1)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className={courseDetailStylesH.progressBarContainer}>
                    <div
                      className={courseDetailStylesH.progressBar}
                      style={{
                        width: `${
                          (completedChapters.size /
                            (course.lectures?.flatMap((l) => l.chapters || [])
                              .length || 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className={courseDetailStylesH.progressStats}>
                  <div className={courseDetailStylesH.progressStat}>
                    <div className={courseDetailStylesH.progressStatValue}>
                      {fmtMinutes(totalMinutes)}
                    </div>
                    <div className={courseDetailStylesH.progressStatLabel}>
                      Total Duration
                    </div>
                  </div>
                  <div className={courseDetailStylesH.progressStat}>
                    <div className={courseDetailStylesH.progressStatValue}>
                      {completedChapters.size}
                    </div>
                    <div className={courseDetailStylesH.progressStatLabel}>
                      Completed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx={true}>{courseDetailCustomStyles}</style>
    </div>
  );
};

export default CourseDetailHomePage;