import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'domain-request'>('email');
  const [error, setError] = useState('');

  // In a real app, this connects to the backend
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Mock backend call
    if (email.endsWith('@example.edu')) {
      setStep('otp');
    } else {
      setError('Your college isn\'t registered yet');
      setStep('domain-request');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Mock verify
    if (otp === '123456') {
      navigate('/onboarding');
    } else {
      setError('Invalid OTP');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">StudyMate</h1>
        
        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">College Email</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                placeholder="student@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700">
              Send Login Code
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Verification Code</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-center tracking-widest text-xl"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700">
              Verify
            </button>
          </form>
        )}

        {step === 'domain-request' && (
          <div className="space-y-4 text-center">
            <p className="text-gray-700 font-medium">{error}</p>
            <p className="text-sm text-gray-500">We're expanding quickly. Request access for your college.</p>
            <button onClick={() => setStep('email')} className="w-full bg-gray-100 text-gray-700 p-2 rounded-md hover:bg-gray-200 mt-4">
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
