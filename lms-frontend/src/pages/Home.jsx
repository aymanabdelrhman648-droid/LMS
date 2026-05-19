import React from 'react'
import Navbar from '../components/Navbar'
import Banner from '../components/Banner'
import HomeCourses from '../components/HomeCourses'
import Testimonial from '../components/Testimonial'
import Footer from '../components/Footer'
const Home = () => {
  return (
    <div>
      <Navbar />
      <Banner />
      <HomeCourses/>
      <Testimonial />
      <Footer />
    </div>
  )
}

export default Home