import React, { useState,useEffect } from 'react'
import {useAuth} from '@clerk/clerk-react'
import  axios  from 'axios';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
 const API_BASE = 'http://localhost:4000';
const VerifyPaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {getToken} = useAuth();
    
  useEffect(() => {
  let cancelled = false;

  const verifyPayment = async () => {
    const searchParams = new URLSearchParams(location.search || "");
    const rawSessionId = searchParams.get("session_id");
    const sessionId = rawSessionId ? rawSessionId.trim() : null;

    if (!sessionId) {
      navigate("/mycourses?payment_status=Unpaid", {
        replace: true,
      });
      return;
    }

    let clerktoken = null;

    try {
      clerktoken = await getToken();
    } catch (error) {
      clerktoken = null;
    }

    const headers = {};

    if (clerktoken) {
      headers.Authorization = `Bearer ${clerktoken}`;
    }

    try {
      const res = await axios.get(
        `${API_BASE}/api/booking/confirm`,
        {
          headers,
          params: {  session_id:sessionId },
          withCredentials: true,
        }
      );

      if (!cancelled) {
        if (res.data.success) {
          navigate("/mycourses?payment_status=Paid", {
            replace: true,
          });
        } else {
          navigate("/mycourses?payment_status=Unpaid", {
            replace: true,
          });
        }
      }
    } catch (error) {
      if (!cancelled) {
        navigate("/mycourses?payment_status=Unpaid", {
          replace: true,
        });
      }
    }
  };

  verifyPayment();

  return () => {
    cancelled = true;
  };
}, [getToken, location.search, navigate]);
  return null;
}

export default VerifyPaymentPage