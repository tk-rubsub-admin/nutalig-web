import React from "react";
import { RequireUserProps } from "./types";
import { auth } from "../..";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate } from "react-router-dom";
import { RoutesEnum } from "../../../../routes";

const RequireUser: React.FC<RequireUserProps> = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  if (loading) return <div>Loading...</div>;

  if (!user || user === null) return <Navigate to={RoutesEnum.Login} />;
  return children;
};

export default RequireUser;
