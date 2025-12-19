import {
  createTheme as createMuiTheme,
  ThemeOptions,
  PaletteColor,
  PaletteColorOptions,
} from '@mui/material/styles';
import { tokens } from '../design-system/tokens';

declare module '@mui/material/styles' {
  interface Palette {
    tertiary: PaletteColor;
    accent: PaletteColor;
  }

  interface PaletteOptions {
    tertiary?: PaletteColorOptions;
    accent?: PaletteColorOptions;
  }

  interface Theme {
    customBorderRadius: {
      sm: string;
      md: string;
      lg: string;
    };
    customTypography: {
      fontSize: {
        sm: string;
        md: string;
      };
    };
  }

  interface ThemeOptions {
    customBorderRadius?: {
      sm: string;
      md: string;
      lg: string;
    };
    customTypography?: {
      fontSize: {
        sm: string;
        md: string;
      };
    };
  }

  interface Typography {
    fontFamily: string;
    fontWeightMedium: number;
  }

  interface TypographyOptions {
    fontFamily?: string;
    fontWeightMedium?: number;
  }

  interface TypographyVariants {
    caption: {
      fontSize: string;
      fontWeight: number;
      lineHeight: string;
      letterSpacing: string;
    };
  }
}

export type ThemeMode = 'light' | 'dark';

export const createTheme = (mode: ThemeMode, overrides?: ThemeOptions) => {
  const isDark = mode === 'dark';

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: tokens.colors.primary[500],
        light: tokens.colors.primary[300],
        dark: tokens.colors.primary[700],
        contrastText: tokens.colors.text.onPrimary,
        50: tokens.colors.primary[50],
        100: tokens.colors.primary[100],
        200: tokens.colors.primary[200],
        300: tokens.colors.primary[300],
        400: tokens.colors.primary[400],
        500: tokens.colors.primary[500],
        600: tokens.colors.primary[600],
        700: tokens.colors.primary[700],
        800: tokens.colors.primary[800],
        900: tokens.colors.primary[900],
      },
      secondary: {
        main: tokens.colors.secondary[500],
        light: tokens.colors.secondary[300],
        dark: tokens.colors.secondary[700],
        contrastText: tokens.colors.text.onSecondary,
        50: tokens.colors.secondary[50],
        100: tokens.colors.secondary[100],
        200: tokens.colors.secondary[200],
        300: tokens.colors.secondary[300],
        400: tokens.colors.secondary[400],
        500: tokens.colors.secondary[500],
        600: tokens.colors.secondary[600],
        700: tokens.colors.secondary[700],
        800: tokens.colors.secondary[800],
        900: tokens.colors.secondary[900],
      },
      tertiary: {
        main: tokens.colors.tertiary[500],
        light: tokens.colors.tertiary[300],
        dark: tokens.colors.tertiary[700],
        contrastText: tokens.colors.text.onPrimary, // Using white text for tertiary (purple)
        50: tokens.colors.tertiary[50],
        100: tokens.colors.tertiary[100],
        200: tokens.colors.tertiary[200],
        300: tokens.colors.tertiary[300],
        400: tokens.colors.tertiary[400],
        500: tokens.colors.tertiary[500],
        600: tokens.colors.tertiary[600],
        700: tokens.colors.tertiary[700],
        800: tokens.colors.tertiary[800],
        900: tokens.colors.tertiary[900],
      },
      accent: {
        main: tokens.colors.accent[500],
        light: tokens.colors.accent[300],
        dark: tokens.colors.accent[700],
        contrastText: tokens.colors.text.onAccent,
        50: tokens.colors.accent[50],
        100: tokens.colors.accent[100],
        200: tokens.colors.accent[200],
        300: tokens.colors.accent[300],
        400: tokens.colors.accent[400],
        500: tokens.colors.accent[500],
        600: tokens.colors.accent[600],
        700: tokens.colors.accent[700],
        800: tokens.colors.accent[800],
        900: tokens.colors.accent[900],
      },
      error: {
        main: tokens.colors.semantic.error[500],
        light: tokens.colors.semantic.error[300],
        dark: tokens.colors.semantic.error[700],
        contrastText: tokens.colors.text.onError,
        50: tokens.colors.semantic.error[50],
        100: tokens.colors.semantic.error[100],
        200: tokens.colors.semantic.error[200],
        300: tokens.colors.semantic.error[300],
        400: tokens.colors.semantic.error[400],
        500: tokens.colors.semantic.error[500],
        600: tokens.colors.semantic.error[600],
        700: tokens.colors.semantic.error[700],
        800: tokens.colors.semantic.error[800],
        900: tokens.colors.semantic.error[900],
      },
      warning: {
        main: tokens.colors.semantic.warning[500],
        light: tokens.colors.semantic.warning[300],
        dark: tokens.colors.semantic.warning[700],
        contrastText: tokens.colors.text.onWarning,
        50: tokens.colors.semantic.warning[50],
        100: tokens.colors.semantic.warning[100],
        200: tokens.colors.semantic.warning[200],
        300: tokens.colors.semantic.warning[300],
        400: tokens.colors.semantic.warning[400],
        500: tokens.colors.semantic.warning[500],
        600: tokens.colors.semantic.warning[600],
        700: tokens.colors.semantic.warning[700],
        800: tokens.colors.semantic.warning[800],
        900: tokens.colors.semantic.warning[900],
      },
      info: {
        main: tokens.colors.semantic.info[500],
        light: tokens.colors.semantic.info[300],
        dark: tokens.colors.semantic.info[700],
        contrastText: tokens.colors.text.onInfo,
        50: tokens.colors.semantic.info[50],
        100: tokens.colors.semantic.info[100],
        200: tokens.colors.semantic.info[200],
        300: tokens.colors.semantic.info[300],
        400: tokens.colors.semantic.info[400],
        500: tokens.colors.semantic.info[500],
        600: tokens.colors.semantic.info[600],
        700: tokens.colors.semantic.info[700],
        800: tokens.colors.semantic.info[800],
        900: tokens.colors.semantic.info[900],
      },
      success: {
        main: tokens.colors.semantic.success[500],
        light: tokens.colors.semantic.success[300],
        dark: tokens.colors.semantic.success[700],
        contrastText: tokens.colors.text.onSuccess,
        50: tokens.colors.semantic.success[50],
        100: tokens.colors.semantic.success[100],
        200: tokens.colors.semantic.success[200],
        300: tokens.colors.semantic.success[300],
        400: tokens.colors.semantic.success[400],
        500: tokens.colors.semantic.success[500],
        600: tokens.colors.semantic.success[600],
        700: tokens.colors.semantic.success[700],
        800: tokens.colors.semantic.success[800],
        900: tokens.colors.semantic.success[900],
      },
      grey: {
        50: tokens.colors.neutral[50],
        100: tokens.colors.neutral[100],
        200: tokens.colors.neutral[200],
        300: tokens.colors.neutral[300],
        400: tokens.colors.neutral[400],
        500: tokens.colors.neutral[500],
        600: tokens.colors.neutral[600],
        700: tokens.colors.neutral[700],
        800: tokens.colors.neutral[800],
        900: tokens.colors.neutral[900],
        A100: tokens.colors.neutral[100],
        A200: tokens.colors.neutral[200],
        A400: tokens.colors.neutral[400],
        A700: tokens.colors.neutral[700],
      },
      background: {
        default: isDark
          ? tokens.colors.surface.backgroundDark.default
          : tokens.colors.surface.background.default,
        paper: isDark
          ? tokens.colors.surface.backgroundDark.paper
          : tokens.colors.surface.background.paper,
      },
      text: {
        primary: isDark
          ? tokens.colors.text.primary.dark
          : tokens.colors.text.primary.light,
        secondary: isDark
          ? tokens.colors.text.secondary.dark
          : tokens.colors.text.secondary.light,
        disabled: isDark
          ? tokens.colors.text.disabled.dark
          : tokens.colors.text.disabled.light,
      },
      divider: isDark ? tokens.colors.neutral[700] : tokens.colors.neutral[300],
      action: {
        active: isDark
          ? tokens.colors.neutral[400]
          : tokens.colors.neutral[600],
        hover: isDark ? tokens.colors.neutral[800] : tokens.colors.neutral[100],
        selected: isDark
          ? tokens.colors.neutral[700]
          : tokens.colors.neutral[200],
        disabled: isDark
          ? tokens.colors.neutral[600]
          : tokens.colors.neutral[400],
        disabledBackground: isDark
          ? tokens.colors.neutral[800]
          : tokens.colors.neutral[200],
        focus: tokens.colors.border.focus,
      },
    },
    typography: {
      fontFamily: tokens.typography.fontFamily.primary,
      htmlFontSize: 16,
      fontWeightLight: tokens.typography.fontWeight.light,
      fontWeightRegular: tokens.typography.fontWeight.regular,
      fontWeightMedium: tokens.typography.fontWeight.medium,
      fontWeightBold: tokens.typography.fontWeight.bold,
      h1: {
        fontSize: tokens.typography.fontSize['5xl'],
        fontWeight: tokens.typography.fontWeight.bold,
        lineHeight: tokens.typography.lineHeight.tight,
        letterSpacing: tokens.typography.letterSpacing.tighter,
      },
      h2: {
        fontSize: tokens.typography.fontSize['4xl'],
        fontWeight: tokens.typography.fontWeight.bold,
        lineHeight: tokens.typography.lineHeight.tight,
        letterSpacing: tokens.typography.letterSpacing.tight,
      },
      h3: {
        fontSize: tokens.typography.fontSize['3xl'],
        fontWeight: tokens.typography.fontWeight.semibold,
        lineHeight: tokens.typography.lineHeight.snug,
        letterSpacing: tokens.typography.letterSpacing.tight,
      },
      h4: {
        fontSize: tokens.typography.fontSize['2xl'],
        fontWeight: tokens.typography.fontWeight.semibold,
        lineHeight: tokens.typography.lineHeight.snug,
        letterSpacing: tokens.typography.letterSpacing.normal,
      },
      h5: {
        fontSize: tokens.typography.fontSize.xl,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: tokens.typography.lineHeight.normal,
        letterSpacing: tokens.typography.letterSpacing.normal,
      },
      h6: {
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: tokens.typography.lineHeight.normal,
        letterSpacing: tokens.typography.letterSpacing.normal,
      },
      subtitle1: {
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: tokens.typography.lineHeight.relaxed,
        letterSpacing: tokens.typography.letterSpacing.normal,
      },
      subtitle2: {
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: tokens.typography.lineHeight.normal,
        letterSpacing: tokens.typography.letterSpacing.normal,
      },
      body1: {
        fontSize: tokens.typography.fontSize.base,
        fontWeight: tokens.typography.fontWeight.regular,
        lineHeight: tokens.typography.lineHeight.relaxed,
        letterSpacing: tokens.typography.letterSpacing.normal,
      },
      body2: {
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: tokens.typography.fontWeight.regular,
        lineHeight: tokens.typography.lineHeight.normal,
        letterSpacing: tokens.typography.letterSpacing.normal,
      },
      button: {
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: tokens.typography.fontWeight.medium,
        textTransform: 'none',
        letterSpacing: tokens.typography.letterSpacing.wide,
      },
      caption: {
        fontSize: tokens.typography.fontSize.xs,
        fontWeight: tokens.typography.fontWeight.regular,
        lineHeight: tokens.typography.lineHeight.normal,
        letterSpacing: tokens.typography.letterSpacing.wide,
      },
      overline: {
        fontSize: tokens.typography.fontSize.xs,
        fontWeight: tokens.typography.fontWeight.medium,
        textTransform: 'uppercase',
        letterSpacing: tokens.typography.letterSpacing.widest,
      },
    },
    shape: {
      borderRadius: tokens.borderRadius.md,
    },
    customBorderRadius: {
      sm: `${tokens.borderRadius.sm}px`,
      md: `${tokens.borderRadius.md}px`,
      lg: `${tokens.borderRadius.lg}px`,
    },
    customTypography: {
      fontSize: {
        sm: tokens.typography.fontSize.sm,
        md: tokens.typography.fontSize.md,
      },
    },
    spacing: 8,
    breakpoints: {
      values: {
        xs: tokens.breakpoints.xs,
        sm: tokens.breakpoints.sm,
        md: tokens.breakpoints.md,
        lg: tokens.breakpoints.lg,
        xl: tokens.breakpoints.xl,
      },
    },
    shadows: [
      tokens.shadows.elevation[0],
      tokens.shadows.elevation[1],
      tokens.shadows.elevation[2],
      tokens.shadows.elevation[3],
      tokens.shadows.elevation[4],
      tokens.shadows.elevation[4],
      tokens.shadows.elevation[6],
      tokens.shadows.elevation[6],
      tokens.shadows.elevation[8],
      tokens.shadows.elevation[8],
      tokens.shadows.elevation[8],
      tokens.shadows.elevation[8],
      tokens.shadows.elevation[12],
      tokens.shadows.elevation[12],
      tokens.shadows.elevation[12],
      tokens.shadows.elevation[12],
      tokens.shadows.elevation[16],
      tokens.shadows.elevation[16],
      tokens.shadows.elevation[16],
      tokens.shadows.elevation[16],
      tokens.shadows.elevation[16],
      tokens.shadows.elevation[16],
      tokens.shadows.elevation[16],
      tokens.shadows.elevation[16],
      tokens.shadows.elevation[24],
    ],
    transitions: {
      easing: {
        easeInOut: tokens.transitions.easing.easeInOut,
        easeOut: tokens.transitions.easing.easeOut,
        easeIn: tokens.transitions.easing.easeIn,
        sharp: tokens.transitions.easing.sharp,
      },
      duration: {
        shortest: tokens.transitions.duration.fastest,
        shorter: tokens.transitions.duration.fast,
        short: tokens.transitions.duration.normal,
        standard: tokens.transitions.duration.slow,
        complex: tokens.transitions.duration.slower,
        enteringScreen: tokens.transitions.duration.slower,
        leavingScreen: tokens.transitions.duration.slow,
      },
    },
    zIndex: {
      mobileStepper: 1000,
      fab: 1050,
      speedDial: 1050,
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': {
            boxSizing: 'border-box',
          },
          html: {
            scrollBehavior: 'smooth',
          },
          body: {
            fontFamily: tokens.typography.fontFamily.primary,
            fontSize: tokens.typography.fontSize.base,
            lineHeight: tokens.typography.lineHeight.normal,
            color: isDark
              ? tokens.colors.text.primary.dark
              : tokens.colors.text.primary.light,
            backgroundColor: isDark
              ? tokens.colors.surface.backgroundDark.default
              : tokens.colors.surface.background.default,
            // Keep theme transition for smooth dark/light mode switching
            transition: `background-color ${tokens.transitions.duration.fast} ${tokens.transitions.easing.standard}, color ${tokens.transitions.duration.fast} ${tokens.transitions.easing.standard}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.md,
            padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
            fontWeight: tokens.typography.fontWeight.medium,
            textTransform: 'none',
            boxShadow: 'none',
            minHeight: '40px',
            transition: 'none',
            '&:hover': {
              // Minimal hover - just background color change
            },
            '&:active': {
              // No transform
            },
            '&:focus-visible': {
              outline: `2px solid ${tokens.colors.border.focus}`,
              outlineOffset: '2px',
            },
          },
          sizeLarge: {
            padding: `${tokens.spacing[3]} ${tokens.spacing[6]}`,
            fontSize: tokens.typography.fontSize.base,
            minHeight: '48px',
          },
          sizeSmall: {
            padding: `${tokens.spacing[1]} ${tokens.spacing[3]}`,
            fontSize: tokens.typography.fontSize.sm,
            minHeight: '32px',
          },
          containedPrimary: {
            backgroundColor: tokens.colors.primary[500],
            color: tokens.colors.text.onPrimary,
            '&:hover': {
              backgroundColor: tokens.colors.primary[600],
            },
            '&:active': {
              backgroundColor: tokens.colors.primary[700],
            },
          },
          outlinedPrimary: {
            borderColor: tokens.colors.primary[500],
            color: tokens.colors.primary[500],
            '&:hover': {
              borderColor: tokens.colors.primary[600],
              backgroundColor: tokens.colors.primary[50],
            },
          },
          textPrimary: {
            color: tokens.colors.primary[500],
            '&:hover': {
              backgroundColor: tokens.colors.primary[50],
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${isDark ? tokens.colors.neutral[700] : tokens.colors.neutral[200]}`,
            transition: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${isDark ? tokens.colors.neutral[700] : tokens.colors.neutral[200]}`,
            backgroundColor: isDark
              ? tokens.colors.surface.backgroundDark.paper
              : tokens.colors.surface.background.paper,
            transition: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.lg,
            boxShadow: 'none',
            border: `1px solid ${isDark ? tokens.colors.neutral[700] : tokens.colors.neutral[200]}`,
            backgroundColor: isDark
              ? tokens.colors.surface.backgroundDark.paper
              : tokens.colors.surface.background.paper,
            transition: 'none',
            '&:hover': {
              // No hover effects by default
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.md,
            transition: 'none',
            '&:hover': {
              backgroundColor: isDark
                ? tokens.colors.neutral[700]
                : tokens.colors.neutral[100],
            },
            '&:focus-visible': {
              outline: `2px solid ${tokens.colors.border.focus}`,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: tokens.borderRadius.lg,
            boxShadow: tokens.shadows.elevation[8],
            border: `1px solid ${isDark ? tokens.colors.neutral[700] : tokens.colors.neutral[200]}`,
            marginTop: tokens.spacing[1],
            minWidth: '200px',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.sm,
            margin: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
            padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
            transition: 'none',
            '&:hover': {
              backgroundColor: isDark
                ? tokens.colors.neutral[700]
                : tokens.colors.neutral[100],
            },
            '&:focus-visible': {
              outline: `2px solid ${tokens.colors.border.focus}`,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: 'inherit',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: tokens.borderRadius.lg,
            // Make dialogs responsive
            '@media (max-width: 600px)': {
              margin: tokens.spacing[2],
              width: `calc(100% - ${tokens.spacing[4]})`,
              maxWidth: '100%',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: tokens.borderRadius.md,
              transition: 'none',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark
                  ? tokens.colors.neutral[500]
                  : tokens.colors.neutral[400],
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: tokens.colors.border.focus,
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.full,
            fontWeight: tokens.typography.fontWeight.medium,
            fontSize: tokens.typography.fontSize.sm,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${isDark ? tokens.colors.neutral[700] : tokens.colors.neutral[200]}`,
          },
          indicator: {
            backgroundColor: tokens.colors.primary[500],
            height: '3px',
            borderRadius: tokens.borderRadius.full,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontFamily: tokens.typography.fontFamily.primary,
            textTransform: 'none',
            fontWeight: tokens.typography.fontWeight.medium,
            fontSize: tokens.typography.fontSize.sm,
            minHeight: '48px', // Touch-friendly height
            padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
            transition: 'none',
            '&:hover': {
              color: tokens.colors.primary[500],
              backgroundColor: isDark
                ? tokens.colors.neutral[800]
                : tokens.colors.neutral[50],
            },
            '&.Mui-selected': {
              color: tokens.colors.primary[500],
              fontWeight: tokens.typography.fontWeight.semibold,
            },
            '@media (hover: none)': {
              // Remove hover effects on touch devices
              '&:hover': {
                backgroundColor: 'transparent',
              },
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.lg,
            border: `1px solid`,
          },
          standardSuccess: {
            backgroundColor: isDark
              ? tokens.colors.semantic.success[900]
              : tokens.colors.semantic.success[50],
            borderColor: isDark
              ? tokens.colors.semantic.success[700]
              : tokens.colors.semantic.success[200],
            color: isDark
              ? tokens.colors.semantic.success[100]
              : tokens.colors.semantic.success[800],
            '& .MuiAlert-icon': {
              color: isDark
                ? tokens.colors.semantic.success[300]
                : tokens.colors.semantic.success[600],
            },
          },
          standardError: {
            backgroundColor: isDark
              ? tokens.colors.semantic.error[900]
              : tokens.colors.semantic.error[50],
            borderColor: isDark
              ? tokens.colors.semantic.error[700]
              : tokens.colors.semantic.error[200],
            color: isDark
              ? tokens.colors.semantic.error[100]
              : tokens.colors.semantic.error[800],
            '& .MuiAlert-icon': {
              color: isDark
                ? tokens.colors.semantic.error[300]
                : tokens.colors.semantic.error[600],
            },
          },
          standardWarning: {
            backgroundColor: isDark
              ? tokens.colors.semantic.warning[900]
              : tokens.colors.semantic.warning[50],
            borderColor: isDark
              ? tokens.colors.semantic.warning[700]
              : tokens.colors.semantic.warning[200],
            // Use darker shades for better contrast in both modes
            color: isDark
              ? tokens.colors.neutral[100]
              : tokens.colors.neutral[900],
            '& .MuiAlert-icon': {
              color: isDark
                ? tokens.colors.semantic.warning[300]
                : tokens.colors.semantic.warning[700],
            },
          },
          standardInfo: {
            backgroundColor: isDark
              ? tokens.colors.semantic.info[900]
              : tokens.colors.semantic.info[50],
            borderColor: isDark
              ? tokens.colors.semantic.info[700]
              : tokens.colors.semantic.info[200],
            color: isDark
              ? tokens.colors.semantic.info[100]
              : tokens.colors.semantic.info[800],
            '& .MuiAlert-icon': {
              color: isDark
                ? tokens.colors.semantic.info[300]
                : tokens.colors.semantic.info[600],
            },
          },
        },
      },
    },
  };

  // Apply overrides if provided
  const finalThemeOptions = overrides
    ? {
        ...themeOptions,
        palette: {
          ...themeOptions.palette,
          ...overrides.palette,
        },
        typography: {
          ...themeOptions.typography,
          ...overrides.typography,
        },
        ...overrides,
      }
    : themeOptions;

  return createMuiTheme(finalThemeOptions);
};
