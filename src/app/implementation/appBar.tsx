'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  AppBar as MuiAppBar,
  useTheme as useMuiTheme,
  useMediaQuery,
  Drawer,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import '@/app/theme/createTheme'; // Import for theme type augmentation
import { AppBarProps } from '@/app/types/AppBarProps';
import { Toolbar } from '@/app/components/Toolbar/Toolbar';
import { Box } from '@/app/components/Box/Box';
import { Menu } from '@/app/components/Menu/Menu';
import { MenuItem } from '@/app/components/MenuItem/MenuItem';
import { Link } from '@/app/components/Link/Link';
import { Divider } from '@/app/components/Divider/Divider';
import { Typography } from '@/app/components/Typography/Typography';
import { IconButton } from '@/app/components/IconButton/IconButton';
import { List } from '@/app/components/List/List';
import { ListItem } from '@/app/components/List/ListItem';

export const AppBarImpl = React.forwardRef<HTMLDivElement, AppBarProps>(
  (
    {
      logo,
      logoHref = '/',
      onLogoClick,
      wordmark,
      links = [],
      menuItems = [],
      menuLabel = 'Menu',
      accountButton,
      onAccountButtonClick,
      position = 'static',
      elevation = 0,
      variant = 'surface',
      ...props
    },
    ref
  ) => {
    const theme = useMuiTheme() as Theme;
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [linkMenuAnchors, setLinkMenuAnchors] = useState<{
      [key: number]: HTMLElement | null;
    }>({});
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const open = Boolean(anchorEl);

    // Theme-aware variant styles - MUI v7 compliant
    // Memoized to prevent recalculation on every render
    const variantStyles = useMemo(() => {
      const baseStyles = {
        fontFamily: theme.typography.fontFamily,
        transition: theme.transitions.create(
          ['background-color', 'color', 'box-shadow'],
          {
            duration: theme.transitions.duration.short,
          }
        ),
      };

      switch (variant) {
        case 'primary':
          return {
            ...baseStyles,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            boxShadow: theme.shadows[2],
            '& .MuiLink-root, & .nav-button': {
              color: theme.palette.primary.contrastText,
              '&:hover': {
                color: theme.palette.primary.light,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.contrastText}`,
                outlineOffset: theme.spacing(0.25),
              },
            },
          };
        case 'transparent':
          return {
            ...baseStyles,
            backgroundColor: 'transparent',
            color: 'inherit',
            boxShadow: 'none',
            '& .MuiLink-root, & .nav-button': {
              color: theme.palette.text.primary,
              '&:hover': {
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: theme.spacing(0.25),
              },
            },
          };
        case 'dark':
          return {
            ...baseStyles,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? theme.palette.grey[800]
                : theme.palette.grey[900],
            color: theme.palette.common.white,
            boxShadow: theme.shadows[1],
            '& .MuiLink-root, & .nav-button': {
              color: theme.palette.common.white,
              '&:hover': {
                color: theme.palette.primary.light,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.common.white}`,
                outlineOffset: theme.spacing(0.25),
              },
            },
          };
        case 'surface':
        default:
          return {
            ...baseStyles,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: theme.shadows[0],
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiLink-root, & .nav-button': {
              color: theme.palette.text.primary,
              '&:hover': {
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: theme.spacing(0.25),
              },
            },
          };
      }
    }, [variant, theme]); // Only recalculate when variant or theme changes

    // Memoized event handlers to prevent recreating functions on each render
    const handleMenuOpen = useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
      },
      []
    );

    const handleMenuClose = useCallback(() => {
      setAnchorEl(null);
    }, []);

    // Memoized to prevent recreation when handleMenuClose changes
    const handleMenuItemClick = useCallback(
      (onClick?: () => void) => {
        handleMenuClose();
        onClick?.();
      },
      [handleMenuClose]
    );

    // Memoized factory function for link menu handlers
    const handleLinkMenuOpen = useCallback(
      (index: number) => (event: React.MouseEvent<HTMLElement>) => {
        setLinkMenuAnchors((prev) => ({
          ...prev,
          [index]: event.currentTarget,
        }));
      },
      []
    );

    const handleLinkMenuClose = useCallback(
      (index: number) => () => {
        setLinkMenuAnchors((prev) => ({ ...prev, [index]: null }));
      },
      []
    );

    const handleLinkMenuItemClick = useCallback(
      (index: number, onClick?: () => void) => {
        setLinkMenuAnchors((prev) => ({ ...prev, [index]: null }));
        onClick?.();
      },
      []
    );

    const handleLogoClick = useCallback(
      (e: React.MouseEvent) => {
        if (onLogoClick) {
          e.preventDefault();
          onLogoClick();
        }
      },
      [onLogoClick]
    );

    const handleMobileDrawerToggle = useCallback(() => {
      setMobileDrawerOpen((prev) => !prev);
    }, []);

    const handleMobileDrawerClose = useCallback(() => {
      setMobileDrawerOpen(false);
    }, []);

    // Handle account button click - either open menu or call custom handler
    const handleAccountButtonClick = useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        console.log('AppBar button clicked:', {
          menuItemsLength: menuItems.length,
          firstItemLabel: menuItems[0]?.label,
          hasCustomHandler: !!onAccountButtonClick,
        });

        // If there are actual menu items (not just dummy), open the menu
        if (menuItems.length > 0 && menuItems[0].label !== '') {
          console.log('Opening menu dropdown');
          handleMenuOpen(event);
        } else if (onAccountButtonClick) {
          // Otherwise call custom click handler
          console.log('Calling custom click handler');
          onAccountButtonClick();
        }
      },
      [menuItems, handleMenuOpen, onAccountButtonClick]
    );

    const { sx, ...otherProps } = props;

    // Mobile drawer content
    const mobileDrawerContent = (
      <Box
        sx={{
          width: 280,
          height: '100%',
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: {
              xs: 1.5, // Slightly less padding on very small screens
              sm: 2, // Standard padding on larger screens
            },
            minHeight: '64px', // Ensure adequate touch target
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: {
                xs: 0.5, // Tighter spacing on small screens
                sm: 1, // Standard spacing on larger screens
              },
              flex: 1, // Take available space
              minWidth: 0, // Allow shrinking
            }}
          >
            {logo && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  // Responsive logo sizing in drawer
                  '& img': {
                    height: '28px', // Slightly smaller in drawer
                    width: 'auto',
                  },
                }}
              >
                {logo}
              </Box>
            )}
            {wordmark && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: theme.typography.fontWeightMedium,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: {
                    xs: theme.typography.body1.fontSize,
                    sm: theme.typography.h6.fontSize,
                  },
                }}
              >
                {wordmark}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={handleMobileDrawerClose}
            sx={{
              p: 1,
              flexShrink: 0, // Don't shrink this button
              minWidth: '48px', // Ensure adequate touch target
              minHeight: '48px',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Navigation Links */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List sx={{ pt: 2 }}>
            {links.map((link, index) => (
              <ListItem
                key={index}
                sx={{ flexDirection: 'column', alignItems: 'stretch' }}
              >
                {link.menuItems && link.menuItems.length > 0 ? (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        px: 2,
                        py: 1,
                        color: theme.palette.text.secondary,
                        fontWeight: theme.typography.fontWeightMedium,
                      }}
                    >
                      {link.label}
                    </Typography>
                    {link.menuItems.map((menuItem, menuIndex) => (
                      <Box key={menuIndex}>
                        {menuItem.divider && menuIndex > 0 && (
                          <Divider sx={{ mx: 2 }} />
                        )}
                        <Link
                          href={menuItem.href}
                          onClick={() => {
                            handleMobileDrawerClose();
                            menuItem.onClick?.();
                          }}
                          variant="inherit"
                          underline="none"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 3,
                            py: 1.5,
                            color: theme.palette.text.primary,
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          {menuItem.icon && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {menuItem.icon}
                            </Box>
                          )}
                          {menuItem.label}
                        </Link>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Link
                    href={link.href}
                    onClick={() => {
                      handleMobileDrawerClose();
                      link.onClick?.();
                    }}
                    variant="inherit"
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      px: 2,
                      py: 1.5,
                      color: theme.palette.text.primary,
                      fontWeight: theme.typography.fontWeightMedium,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    {link.label}
                  </Link>
                )}
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Menu Items at Bottom */}
        {menuItems.length > 0 && (
          <Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
            <List>
              {menuItems.map((item, index) => (
                <ListItem key={index}>
                  {item.divider && index > 0 && <Divider />}
                  <Link
                    href={item.href}
                    onClick={() => {
                      handleMobileDrawerClose();
                      item.onClick?.();
                    }}
                    variant="inherit"
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1.5,
                      color: theme.palette.text.primary,
                      width: '100%',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    {item.icon && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {item.icon}
                      </Box>
                    )}
                    {item.label}
                  </Link>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    );

    return (
      <>
        <MuiAppBar
          ref={ref}
          position={position}
          elevation={elevation}
          sx={{ ...variantStyles, ...sx }}
          {...otherProps}
        >
          <Toolbar>
            {/* Mobile Menu Button */}
            {isMobile && (links.length > 0 || menuItems.length > 0) && (
              <IconButton
                color="inherit"
                aria-label="open mobile menu"
                edge="start"
                onClick={handleMobileDrawerToggle}
                sx={{
                  mr: {
                    xs: 1, // Less margin on very small screens
                    sm: 2, // Standard margin on larger screens
                  },
                  minWidth: '48px', // Ensure adequate touch target
                  minHeight: '48px',
                  p: 1.5, // Better touch target padding
                }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Left Zone - Brand */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flex: isMobile ? 1 : 'none',
                minWidth: 0, // Allow content to shrink if needed
                // Ensure proper spacing from hamburger menu
                ml:
                  isMobile && (links.length > 0 || menuItems.length > 0)
                    ? 0
                    : 'auto',
              }}
            >
              {logo && (
                <Box
                  sx={{
                    mr: wordmark ? theme.spacing(1) : 0,
                    // Responsive logo sizing
                    '& img': {
                      height: {
                        xs: '32px', // 375px and up
                        sm: '36px', // 600px and up
                        md: '40px', // 900px and up
                      },
                      width: 'auto',
                      transition: theme.transitions.create('height', {
                        duration: theme.transitions.duration.short,
                      }),
                    },
                  }}
                >
                  <Link
                    href={logoHref}
                    onClick={handleLogoClick}
                    variant="inherit"
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {logo}
                  </Link>
                </Box>
              )}
              {wordmark && (
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: theme.typography.fontWeightMedium,
                    color: 'inherit',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    // Responsive font sizing
                    fontSize: {
                      xs: theme.typography.body1.fontSize, // Smaller on mobile
                      sm: theme.typography.h6.fontSize, // Standard size on tablet+
                    },
                    // Limit width on very small screens
                    maxWidth: {
                      xs: '150px', // Limit width on mobile
                      sm: 'none', // No limit on larger screens
                    },
                  }}
                  component={logo ? 'span' : Link}
                  {...(logo
                    ? {}
                    : { href: logoHref, onClick: handleLogoClick })}
                >
                  {wordmark}
                </Typography>
              )}
            </Box>

            {/* Navigation Zone - Primary Navigation (Desktop Only) */}
            {!isMobile && (
              <Box
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  mr: theme.spacing(2),
                }}
              >
                {links.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing(3),
                    }}
                  >
                    {links.map((link, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        {link.menuItems && link.menuItems.length > 0 ? (
                          // Dropdown link
                          <>
                            <Box
                              component="button"
                              className="nav-button"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: theme.spacing(0.5),
                                background: 'none',
                                border: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                fontSize: theme.typography.body1.fontSize,
                                fontWeight: theme.typography.fontWeightRegular,
                                fontFamily: theme.typography.fontFamily,
                                padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
                                borderRadius:
                                  theme.customBorderRadius?.md ||
                                  theme.shape.borderRadius,
                                minHeight: '48px',
                                transition: theme.transitions.create(
                                  ['background-color', 'color'],
                                  {
                                    duration: theme.transitions.duration.short,
                                  }
                                ),
                                '&:focus-visible': {
                                  outline: `2px solid ${theme.palette.primary.main}`,
                                  outlineOffset: theme.spacing(0.25),
                                },
                              }}
                              aria-controls={
                                Boolean(linkMenuAnchors[index])
                                  ? `link-menu-${index}`
                                  : undefined
                              }
                              aria-haspopup="menu"
                              aria-expanded={
                                Boolean(linkMenuAnchors[index])
                                  ? 'true'
                                  : 'false'
                              }
                              onClick={handleLinkMenuOpen(index)}
                            >
                              {link.label}
                              <ArrowDropDownIcon
                                sx={{
                                  fontSize: '1.2rem',
                                  color: 'inherit',
                                  transition: theme.transitions.create(
                                    'transform',
                                    {
                                      duration:
                                        theme.transitions.duration.short,
                                    }
                                  ),
                                  transform: Boolean(linkMenuAnchors[index])
                                    ? 'rotate(180deg)'
                                    : 'rotate(0deg)',
                                }}
                              />
                            </Box>
                            <Menu
                              id={`link-menu-${index}`}
                              anchorEl={linkMenuAnchors[index]}
                              open={Boolean(linkMenuAnchors[index])}
                              onClose={handleLinkMenuClose(index)}
                              anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                              }}
                              transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                              }}
                              sx={{
                                '& .MuiPaper-root': {
                                  marginTop: theme.spacing(0.5),
                                  minWidth: 180,
                                },
                              }}
                            >
                              {link.menuItems.flatMap((menuItem, menuIndex) => {
                                const elements = [];
                                if (menuItem.divider && menuIndex > 0) {
                                  elements.push(
                                    <Divider key={`divider-${menuIndex}`} />
                                  );
                                }
                                elements.push(
                                  <MenuItem
                                    key={`item-${menuIndex}`}
                                    icon={menuItem.icon}
                                    component={menuItem.href ? 'a' : undefined}
                                    href={menuItem.href}
                                    target={menuItem.href?.startsWith('http') ? '_blank' : undefined}
                                    rel={menuItem.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                                    onClick={() =>
                                      handleLinkMenuItemClick(
                                        index,
                                        menuItem.onClick
                                      )
                                    }
                                  >
                                    {menuItem.label}
                                  </MenuItem>
                                );
                                return elements;
                              })}
                            </Menu>
                          </>
                        ) : (
                          // Simple link
                          <Link
                            href={link.href}
                            onClick={link.onClick}
                            variant="inherit"
                            underline="none"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: theme.typography.body1.fontSize,
                              fontWeight: theme.typography.fontWeightRegular,
                              padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
                              borderRadius:
                                theme.customBorderRadius?.md ||
                                theme.shape.borderRadius,
                              minHeight: '48px',
                              transition: theme.transitions.create(
                                ['background-color', 'color'],
                                {
                                  duration: theme.transitions.duration.short,
                                }
                              ),
                              '&:focus-visible': {
                                outline: `2px solid ${theme.palette.primary.main}`,
                                outlineOffset: theme.spacing(0.25),
                              },
                            }}
                          >
                            {link.label}
                          </Link>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Right Zone - Account Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!isMobile && menuItems.length > 0 && (
                <>
                  <Box
                    component="button"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing(1),
                      background: 'none',
                      border: `1px solid ${theme.palette.divider}`,
                      color: theme.palette.text.primary,
                      cursor: 'pointer',
                      padding: `${theme.spacing(0.75)} ${theme.spacing(1.5)}`,
                      borderRadius:
                        theme.customBorderRadius?.md ||
                        theme.shape.borderRadius,
                      fontSize: theme.typography.body1.fontSize,
                      fontWeight: theme.typography.fontWeightMedium,
                      fontFamily: theme.typography.fontFamily,
                      minHeight: '48px',
                      minWidth: '120px',
                      transition: theme.transitions.create(
                        ['background-color', 'border-color', 'color'],
                        {
                          duration: theme.transitions.duration.short,
                        }
                      ),
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                      },
                      '&:focus-visible': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: theme.spacing(0.25),
                      },
                    }}
                    aria-label={typeof menuLabel === 'string' ? menuLabel : 'Account menu'}
                    aria-controls={open ? 'app-bar-menu' : undefined}
                    aria-haspopup="menu"
                    aria-expanded={open ? 'true' : 'false'}
                    onClick={handleAccountButtonClick}
                  >
                    {menuLabel}
                    {menuItems.length > 0 && menuItems[0].label !== '' && (
                      <ArrowDropDownIcon
                        sx={{
                          color: 'inherit',
                          transition: theme.transitions.create('transform', {
                            duration: theme.transitions.duration.short,
                          }),
                          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    )}
                  </Box>
                  <Menu
                    id="app-bar-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    MenuListProps={{
                      'aria-labelledby': typeof menuLabel === 'string' ? menuLabel : 'Account menu',
                    }}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    {menuItems.flatMap((item, index) => {
                      const elements = [];
                      if (item.divider && index > 0) {
                        elements.push(<Divider key={`divider-${index}`} />);
                      }
                      elements.push(
                        <MenuItem
                          key={`item-${index}`}
                          icon={item.icon}
                          component={item.href ? 'a' : undefined}
                          href={item.href}
                          target={item.href?.startsWith('http') ? '_blank' : undefined}
                          rel={item.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                          onClick={() => handleMenuItemClick(item.onClick)}
                        >
                          {item.label}
                        </MenuItem>
                      );
                      return elements;
                    })}
                  </Menu>
                </>
              )}
              {!isMobile && menuItems.length > 0 && accountButton && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    height: '32px',
                    alignSelf: 'center',
                    mx: 1,
                  }}
                />
              )}
              {accountButton}
            </Box>
          </Toolbar>
        </MuiAppBar>

        {/* Mobile Navigation Drawer */}
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={handleMobileDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: {
                xs: '280px', // Standard width on mobile
                // Ensure drawer doesn't exceed screen width on very small screens
              },
              maxWidth: '85vw', // Never exceed 85% of screen width
            },
          }}
        >
          {mobileDrawerContent}
        </Drawer>
      </>
    );
  }
);

AppBarImpl.displayName = 'AppBarImpl';
