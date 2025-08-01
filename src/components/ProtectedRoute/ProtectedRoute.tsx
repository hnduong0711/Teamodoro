import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Spinner from "../Spinner/Spinner";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className=""><Spinner /></div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
