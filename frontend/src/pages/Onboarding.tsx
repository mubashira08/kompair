import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    department: '',
    graduationYear: new Date().getFullYear() + 2,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save profile logic here
    navigate('/main');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Complete Your Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department/Major</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Graduation Year</label>
            <input
              type="number"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              value={formData.graduationYear}
              onChange={(e) => setFormData({ ...formData, graduationYear: parseInt(e.target.value) })}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 mt-6">
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
};
