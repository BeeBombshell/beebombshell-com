"use client";

import React, { useState } from "react";
import { AdminLogin } from "./admin-login";
import { AdminDashboard } from "./admin-dashboard";

interface AdminRootProps {
  initialAuthenticated: boolean;
}

export function AdminRoot({ initialAuthenticated }: AdminRootProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <AdminDashboard onLogout={() => setIsAuthenticated(false)} />;
}
