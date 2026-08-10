import { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserRole, MockUser } from '@/types';
import { mockUsers } from '@/mock-data';

type Permissions = {
  canManageEvents: boolean;
  canManageConvocations: boolean;
  canManageCommunications: boolean;
  canManagePlayers: boolean;
  canConfirmAttendance: boolean;
};

const rolePermissions: Record<UserRole, Permissions> = {
  coach: {
    canManageEvents: true,
    canManageConvocations: true,
    canManageCommunications: true,
    canManagePlayers: true,
    canConfirmAttendance: false,
  },
  manager: {
    canManageEvents: true,
    canManageConvocations: true,
    canManageCommunications: true,
    canManagePlayers: true,
    canConfirmAttendance: false,
  },
  parent: {
    canManageEvents: false,
    canManageConvocations: false,
    canManageCommunications: false,
    canManagePlayers: false,
    canConfirmAttendance: true,
  },
};

type AuthContextValue = {
  user: MockUser;
  role: UserRole;
  permissions: Permissions;
  setUser: (user: MockUser) => void;
  setRole: (role: UserRole) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser>(mockUsers[0]);

  const role = user.role;
  const permissions = rolePermissions[role];

  const value: AuthContextValue = {
    user,
    role,
    permissions,
    setUser,
    setRole: (newRole: UserRole) => {
      const found = mockUsers.find((u) => u.role === newRole);
      if (found) setUser(found);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
