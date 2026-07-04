import React from 'react';
import { useAuth, useTheme, useUI } from '@brix-sdk/runtime-sdk-react';

export interface CasePermissionGuardProps {
  permissions: string[];
  children: React.ReactNode;
}

export const CasePermissionGuard: React.FC<CasePermissionGuardProps> = ({ permissions, children }) => {
  const { Box, Button, Card, Icon, Spin, Typography } = useUI();
  const { tokens } = useTheme();
  const { isLoading, hasAnyPermission } = useAuth();
  const allowed = hasAnyPermission([...permissions, 'case:manage']);

  if (isLoading) {
    return (
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Spin />
      </Box>
    );
  }

  if (!allowed) {
    return (
      <Box style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
        <Card>
          <Box style={{ padding: 32, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <Box
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tokens.colors.surface.page,
                color: tokens.colors.status.warning,
                flexShrink: 0,
              }}
            >
              <Icon name="lock" size={22} />
            </Box>
            <Box style={{ flex: 1 }}>
              <Typography variant="h2" style={{ marginBottom: 8, color: tokens.colors.text.primary }}>
                Access denied
              </Typography>
              <Typography variant="body2" style={{ color: tokens.colors.text.secondary, marginBottom: 20 }}>
                Your current role does not have permission to access this case workspace.
              </Typography>
              <Button variant="secondary" onClick={() => window.history.back()}>
                Back
              </Button>
            </Box>
          </Box>
        </Card>
      </Box>
    );
  }

  return <>{children}</>;
};