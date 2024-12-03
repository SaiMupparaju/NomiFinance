import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';

const LogoutPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    let isSubscribed = true;

    const handleLogout = async () => {
      if (isSubscribed) {
        await Swal.fire({
          icon: 'info',
          title: 'Session Expired',
          text: 'Your session has expired. Please log in again to continue.',
          confirmButtonText: 'OK',
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        logout();
        navigate('/login', { replace: true });
      }
    };

    handleLogout();

    return () => {
      isSubscribed = false;
    };
  }, [navigate, logout]);

  return null;
};

export default LogoutPage;