// import {HospitalChatbot} from "@/components/hospital-chatbot"

import HospitalChatbot from "@/components/hospital-chatbot";

export default function Page() {
  return (
    <div className="bg-pink-200 h-screen w-screen overflow-hidden">
      {/* Demo content */}
      {/* <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-bold text-gray-900">Welcome to MediCare Hospital</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Experience premium healthcare with our AI-powered assistance. Book appointments, upload medical reports, or
            get instant health guidance.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Expert Doctors</h3>
              <p className="text-sm text-gray-600">24/7 access to medical professionals</p>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-sm text-gray-600">Your health data is protected</p>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fast Response</h3>
              <p className="text-sm text-gray-600">Instant AI-powered assistance</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Hospital Chatbot */}
      <HospitalChatbot />
    </div>
  )
}
