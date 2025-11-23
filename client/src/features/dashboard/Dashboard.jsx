import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';
import { ManagerDashboard } from './ManagerDashboard';
import { StaffDashboard } from './StaffDashboard';

export const Dashboard = () => {
  const { user } = useAuth();

  // Render different dashboard based on user role
  if (user?.role === ROLES.INVENTORY_MANAGER) {
    return <ManagerDashboard />;
  }

  return <StaffDashboard />;
};

