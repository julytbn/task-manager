import React from 'react';
import EmployeeGoals from '@/components/dashboard/EmployeeGoals';

const EmployeeGoalsPage = () => {
  return (
    <div>
      <h1>Mes Objectifs</h1>
      <p>Bienvenue sur la page des objectifs des employés.</p>
      <EmployeeGoals />
    </div>
  );
};

export default EmployeeGoalsPage;