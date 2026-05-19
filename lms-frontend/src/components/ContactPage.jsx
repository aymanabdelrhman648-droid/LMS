import React, { useState } from "react";
import { contactStyles } from '../assets/dummyStyles'
import { Phone, MessageSquare, User, Mailbox, MessageCircleDashed, SendHorizonal } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
const Contact = () => {

    const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
   const phoneError =
  formData.phone && !validatePhone(formData.phone)
    ? "Invalid phone number"
    : "";
  const validatePhone = (phone) => /^\d{10}$/.test(phone);
  const [issumbitting , setIsSubmitting] = useState(false)
  const handleSubmit = (e) => {
   e.preventDefault();
    setIsSubmitting(true);
    const whatsappMessage =
      `Name: ${formData.name}%0A` +
      `Email: ${formData.email}%0A` +
      `Phone: ${formData.phone}%0A` +
      `Subject: ${formData.subject}%0A` +
      `Message: ${formData.message}`;

    const whatsappUrl = `https://wa.me/918299431275?text=${whatsappMessage}`;
    window.open(whatsappUrl, "_blank");

  };

const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value
  }));
};
  const isFormValid =
    formData.name &&
    formData.email &&
    validatePhone(formData.phone) &&
    formData.subject &&
    formData.message;
  return (
    <div className={contactStyles.container}>
         <div className={contactStyles.mainContainer}>
              <div className={contactStyles.header}>
                <h1 className={contactStyles.title}>contact us</h1>
              </div>
              <div className={contactStyles.mainSection}>
                   <div className={contactStyles.formContainer}>
                       <div className={contactStyles.formGlow1}></div>
                       <div className={contactStyles.formGlow2}></div>
                       <div className={contactStyles.formGlow3}></div>

                       <div className={contactStyles.form}>
                       <form
                      onSubmit={handleSubmit}
                     className={contactStyles.formElements}
                    >
                         <div className={contactStyles.formGrid}>
                          <div className={contactStyles.formGroup}>
                             <label className={contactStyles.label}>
                                 <User className={contactStyles.labelIcon}/>
                                 FullName 
                             </label>
                             <input type="text" 
                             value={formData.name}
                             name="name"
                             className={`${contactStyles.input} ${contactStyles.colors.purple.focus}`}
                             onChange={handleChange}
                             placeholder="Enter Your Full Name"
                             />

                          </div>
                          
                         <div className={contactStyles.formGroup}>
                               <label className={contactStyles.label}>
                                 <Mailbox className={contactStyles.labelIcon}/>
                                Email Address
                             </label>
                             <input 
                             type="email" 
                             value={formData.email}
                             name="email"
                             className={`${contactStyles.input} ${contactStyles.colors.blue.focus}`}
                             onChange={handleChange}
                             placeholder="Enter Your Email"
                             />  
                             </div>
                          </div>
                          
                            
                      <div className={contactStyles.formGroup}>
                  <label className={contactStyles.label}>
                    <Phone
                      className={`${contactStyles.labelIcon} ${contactStyles.colors.green.icon}`}
                    />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    inputMode="numeric"
                    maxLength={10}
                    className={`${contactStyles.input} ${
                      contactStyles.colors.green.focus
                    } ${contactStyles.colors.green.hover} ${
                      phoneError ? contactStyles.inputError : ""
                    }`}
                    placeholder="Enter your phone number"
                  />
                  {phoneError && (
                    <p className={contactStyles.errorText}>{phoneError}</p>
                  )}
                      </div>

             
                     <div className={contactStyles.formGroup}>
                  <label className={contactStyles.label}>
                    <MessageSquare
                      className={`${contactStyles.labelIcon} ${contactStyles.colors.purple.icon}`}
                    />
                    Subject *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={`${contactStyles.select} ${contactStyles.colors.purple.focus}`}
                  >
                    <option value="">Select a subject</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Project Collaboration">
                      Project Collaboration
                    </option>
                    <option value="Support">Support</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Other">Other</option>
                  </select>
                     </div>

                     <div className={contactStyles.formGroup}>
                          <label className={contactStyles.label}>
                             <MessageCircleDashed className={contactStyles.labelIcon}/>
                              Message *
                          </label>
                          <textarea
                          className={contactStyles.textarea}
                          onChange={handleChange}
                          name="message"
                          value={formData.message}
                          required
                          rows="5"
                          ></textarea>
                     </div>
                     <button className={`${contactStyles.submitButton}
                       ${
                         isFormValid && !issumbitting 
                         ? contactStyles.submitButtonEnabled
                         : contactStyles.submitButtonDisabled
                       }`}
                        disabled={!isFormValid || issumbitting}
                          type="submit">
                            {issumbitting ?(
                               <>
                                <div className={contactStyles.spinner}>
                                     sending...
                                </div>
                              </> 
                              ) : (
                                 <> 
                                  <SendHorizonal className={contactStyles.submitIcon}/>
                                  Send Message
                                </>
                              )}
                     </button>
                     </form>
                  </div>
               </div>

          {/* Animation Section */}
          <div className={contactStyles.animationContainer}>
            <div className={contactStyles.animationWrapper}>
              <DotLottieReact
                src="https://lottie.host/9ccf026c-11e9-417a-9a9d-0169bc83e49d/sMK5FavyPC.lottie"
                loop
                autoplay
                style={{
                  width: "100%",
                  height: "500px",
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.1))",
                }}
              />
            </div>
            </div>
                       </div>
             </div>
              </div>
        
   
  );
  };

export default Contact;