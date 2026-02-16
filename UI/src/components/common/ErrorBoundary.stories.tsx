import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorBoundary } from './ErrorBoundary';
import Typography from '@mui/material/Typography';

/** A component that deliberately throws to trigger the error boundary. */
function BuggyComponent(): never {
  throw new Error('This component crashed intentionally for Storybook demo.');
}

/** A well-behaved component for the success case. */
function HappyComponent() {
  return (
    <Typography variant="body1" sx={{ p: 2 }}>
      ✅ This content rendered successfully inside an ErrorBoundary.
    </Typography>
  );
}

const meta = {
  title: 'Common/ErrorBoundary',
  component: ErrorBoundary,
  args: {
    children: null,
  },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Shows the error fallback UI after a child component throws. */
export const ErrorState: Story = {
  args: {
    children: null,
  },
  render: () => (
    <ErrorBoundary>
      <BuggyComponent />
    </ErrorBoundary>
  ),
};

/** Shows children rendering normally when no error occurs. */
export const NoError: Story = {
  args: {
    children: null,
  },
  render: () => (
    <ErrorBoundary>
      <HappyComponent />
    </ErrorBoundary>
  ),
};
