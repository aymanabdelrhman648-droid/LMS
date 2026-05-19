import React, { useState,useEffect,useRef} from 'react'
import {bookingsStyles} from '../../assets/dummyStyles'
import { BadgeIndianRupee, BookOpen, Search, User } from 'lucide-react';
const Bookingspage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page] = useState(1); // expose later for pagination
  const limit = 200;
    const API_BASE = "http://localhost:4000";
  // debounce timer and abort controller
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

   const fetchBookings = async (search = "") => {
    setLoading(true);
    setError(null);

    // abort previous
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      q.set("limit", String(limit));
      q.set("page", String(page));

      const res = await fetch(`${API_BASE}/api/booking?${q.toString()}`, {
        method: "GET",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.message || `Request failed with status ${res.status}`
        );
      }

      const data = await res.json();
      if (data && data.success) {
        const normalized = (data.bookings || []).map((b, idx) => ({
          id: b._id || b.bookingId || String(idx),
          // userRef removed — use studentName field present in backend
          studentName: b.studentName || b.userName || "Unknown student",
          courseName: b.courseName || "Untitled course",
          price: b.price ?? 0,
          teacherName: b.teacherName || "Unknown teacher",
          purchaseDate: b.createdAt
            ? new Date(b.createdAt).toISOString().split("T")[0]
            : b.purchaseDate || "",
          raw: b,
        }));

        setBookings(normalized);
      } else {
        setBookings([]);
        setError(data?.message || "No data");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // aborted — ignore
      } else {
        console.error("fetchBookings error:", err);
        setError(err.message || "Failed to fetch bookings");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings("");
    // cleanup on unmount
    return () => {
      if (abortRef.current) abortRef.current.abort();
    }; 
    }, []);

    useEffect(() => {
      // debounce search input
      if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchBookings(searchTerm.trim());
        }, 300);
        // cleanup on unmount or searchTerm change
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchTerm]);
  return (
    <div className={bookingsStyles.pageContainer}>
         <div className={bookingsStyles.contentContainer}>
            <div className={bookingsStyles.headerContainer}>
                 <h1 className={bookingsStyles.headerTitle}>course Bookings</h1>
                 <p className={bookingsStyles.headerSubtitle}>Manage and view all course bookings</p>
            </div>

            <div className={bookingsStyles.searchContainer}>
                  <div className={bookingsStyles.searchInputContainer}>
                       <Search className={bookingsStyles.searchIcon}/>
                        <input
                        type="text"
                        placeholder="Search bookings..."
                        value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className={bookingsStyles.searchInput}
                      />
                  </div>
            </div>

            <div style={{
                minHeight:36,
            }}>
                {loading && (
                 <div className={bookingsStyles.loadingState}>Loading bookings...</div>
               )}
                {error && !loading && (
                    <div className={bookingsStyles.errorState}><p>Error: {error}</p></div>
                )}
            </div>

             <div className={bookingsStyles.bookingsGrid}>
                {!loading && 
                bookings.map((booking) => (
                    <div key={booking.id} className={bookingsStyles.bookingCard}>
                        <div className={bookingsStyles.studentSection}>
                            <div className={bookingsStyles.studentIconContainer}>
                                <User className={bookingsStyles.studentIcon}/>
                            </div>

                            <div className={bookingsStyles.studentInfo}>
                                <h3 className={bookingsStyles.studentName}>{booking.studentName}</h3>
                                <p className={bookingsStyles.purchaseDate}>purchased on {booking.purchaseDate}</p>
                            </div>
                        </div> 

                        <div className={bookingsStyles.courseDetails}>
                             <div className={bookingsStyles.detailItem}>
                                 <BookOpen className={bookingsStyles.detailIcon}/>
                                 <span className={bookingsStyles.detailLabel}>Course:</span>
                                 <span className={bookingsStyles.detailValue}>{booking.courseName}</span>
                             </div>
                             
                             <div className={bookingsStyles.detailItem}>
                                 <BadgeIndianRupee className={bookingsStyles.detailIcon}/>
                                 <span className={bookingsStyles.detailLabel}>Price:</span>
                                 <span className={bookingsStyles.detailValue}>
                                    {booking.price}
                                 </span>
                             </div>

                              <div className={bookingsStyles.detailItem}>
                                 <BadgeIndianRupee className={bookingsStyles.detailIcon}/>
                                 <span className={bookingsStyles.detailLabel}>Teacher:</span>
                                 <span className={bookingsStyles.detailValue}>
                                    {booking.teacherName}
                                 </span>
                               </div>
                        </div>

                           <div className={bookingsStyles.statusContainer}>
                              <span className={bookingsStyles.statusBadge}>Completed</span> 
                           </div>

                        
                    </div>
                ))}

            </div>

            {!loading && bookings.length === 0 && !error && (
                <div className={bookingsStyles.noDataState}>
                    <p>No bookings found.</p>
                </div>
            )}
        </div>
    </div>
  )
}

export default Bookingspage