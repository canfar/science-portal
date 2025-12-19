import { SxProps, Theme } from '@mui/material/styles';

// Consistent form styles for responsive layouts
export const formStyles = {
  // Container for form fields
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    '@media (max-width: 600px)': {
      gap: 1.5,
    },
  } as SxProps<Theme>,

  // Form actions (buttons) container
  formActions: {
    mt: 3,
    display: 'flex',
    gap: 2,
    '@media (max-width: 600px)': {
      flexDirection: 'column',
      '& > button': {
        width: '100%',
      },
    },
  } as SxProps<Theme>,

  // Touch-friendly form field
  touchField: {
    '& .MuiOutlinedInput-root': {
      '@media (max-width: 600px)': {
        minHeight: '48px',
      },
    },
  } as SxProps<Theme>,

  // Responsive dialog content
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    pt: 2,
    '@media (max-width: 600px)': {
      gap: 2,
      pt: 1,
    },
  } as SxProps<Theme>,

  // Full width on mobile
  mobileFullWidth: {
    '@media (max-width: 600px)': {
      width: '100%',
    },
  } as SxProps<Theme>,
};

// Helper function to merge multiple sx props
export const mergeSx = (
  ...sxProps: (SxProps<Theme> | undefined)[]
): SxProps<Theme> => {
  const filtered = sxProps.filter(Boolean) as SxProps<Theme>[];
  if (filtered.length === 0) return {};

  return filtered.reduce((acc, sx) => {
    if (Array.isArray(acc)) {
      return [...acc, sx];
    }
    if (Array.isArray(sx)) {
      return [acc, ...sx];
    }
    return [acc, sx];
  }, {} as SxProps<Theme>);
};
