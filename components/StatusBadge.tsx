import React from 'react';

interface StatusBadgeProps {
  status?: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusBadgeStyle = (statut?: string) => {
    const styles: { [key: string]: string } = {
      'VALIDEE': 'bg-green-100/80 text-green-800',
      'EN_ATTENTE': 'bg-yellow-100/80 text-yellow-800',
      'REJETEE': 'bg-red-100/80 text-red-800',
      'CORRIGEE': 'bg-blue-100/80 text-blue-800',
    };
    return styles[statut || ''] || 'bg-gray-100/80 text-gray-800';
  };

  const getStatusLabel = (statut?: string) => {
    const labels: { [key: string]: string } = {
      'VALIDEE': 'Validé',
      'EN_ATTENTE': 'En attente',
      'REJETEE': 'Rejeté',
      'CORRIGEE': 'Corrigé',
    };
    return labels[statut || ''] || (statut || 'N/A');
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(status)} ${className}`}>
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;
