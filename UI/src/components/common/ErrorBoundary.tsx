import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React error boundary — catches rendering errors in child components
 * and displays a friendly fallback UI.
 *
 * This is the only class component in the codebase; React error boundaries
 * require `componentDidCatch` / `getDerivedStateFromError` which are
 * class-only lifecycle methods.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 480, width: '100%' }}>
            <CardContent>
              <Alert severity="error" sx={{ mb: 2 }}>
                Something went wrong
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {this.state.error?.message ??
                  'An unexpected error occurred while rendering this section.'}
              </Typography>
              <Button variant="contained" onClick={this.handleReset}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}
