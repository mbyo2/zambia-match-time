import React from 'react';
import { useNavigate } from 'react-router-dom';
import SubPageWrapper from './SubPageWrapper';

interface SubPageRouteProps {
  title: string;
  children: React.ReactNode;
  backTo?: string;
}

const SubPageRoute: React.FC<SubPageRouteProps> = ({ title, children, backTo = '/app/profile' }) => {
  const navigate = useNavigate();
  return (
    <SubPageWrapper title={title} onBack={() => navigate(backTo)}>
      {children}
    </SubPageWrapper>
  );
};

export default SubPageRoute;
