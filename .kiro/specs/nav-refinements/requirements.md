# Requirements Document

## Introduction

Refinements to the existing layout-system navigation components. This spec covers four changes: widening the desktop PillNav card, integrating a user section (Gravatar + name + logout) into the PillNav on both desktop and mobile, converting the mobile nav to a full-width bar, and horizontally centering the desktop PillNav within the left 3 grid columns.

## Glossary

- **Pill_Nav**: The floating navigation card component (`pill-nav.tsx`) that renders vertically on desktop and horizontally on mobile/tablet
- **User_Section**: A new area within the Pill_Nav displaying the user's Gravatar avatar, first name, and logout action
- **Gravatar_Avatar**: A circular image loaded from `https://www.gravatar.com/avatar/{md5(email.toLowerCase())}?s=80&d=mp`
- **Content_Area**: The main content region rendered via `<Outlet />` in AppShell
- **User_Actions**: The existing standalone component (`user-actions.tsx`) that currently renders profile email and logout button outside the Pill_Nav
- **Grid_Container**: The 12-column centered grid wrapper
- **Nav_Item**: A single navigation link rendered within the Pill_Nav (icon + optional label)

## Requirements

### Requirement 1: Desktop PillNav Width Increase

**User Story:** As a desktop user, I want the navigation card to be wider so that nav labels have more horizontal room and do not feel cramped.

#### Acceptance Criteria

1. WHILE the viewport width is 1440px or greater, THE Pill_Nav card SHALL render at 150% of its current width (50% wider than the existing card width)
2. WHILE the viewport width is 1440px or greater, THE Pill_Nav SHALL maintain its existing vertical layout, rounded-2xl corners, white background, and shadow styling after the width increase
3. WHILE the viewport width is 1440px or greater, THE Pill_Nav items SHALL retain their existing padding, icon size, and text size without modification

### Requirement 2: Desktop PillNav Centering

**User Story:** As a desktop user, I want the floating nav card centered within the left 3 grid columns so that it appears visually balanced rather than offset to one side.

#### Acceptance Criteria

1. WHILE the viewport width is 1440px or greater, THE Pill_Nav SHALL be horizontally centered between the left edge of the Grid_Container and the start of column 4 (the left 3 columns)
2. WHILE the viewport width is 1440px or greater, THE Pill_Nav SHALL remain fixed-positioned and vertically centered (top-1/2, -translate-y-1/2)
3. WHILE the viewport width is 1440px or greater, THE Pill_Nav SHALL NOT use a hard-coded `left-8` offset; the horizontal position SHALL be computed to center the nav card within the space occupied by columns 1–3

### Requirement 3: Desktop User Section in PillNav

**User Story:** As a desktop user, I want to see my avatar and name inside the navigation card so that my identity is visible without consuming content area space.

#### Acceptance Criteria

1. WHILE the viewport width is 1440px or greater, THE Pill_Nav SHALL display a User_Section below the navigation items, separated from them by a thin horizontal divider line
2. THE User_Section SHALL display a Gravatar_Avatar rendered as a 40px circular image using the MD5 hash of the user's lowercase email address with the URL format `https://www.gravatar.com/avatar/{md5(email.toLowerCase())}?s=80&d=mp`
3. THE User_Section SHALL display the user's first name (from `useProfile().firstName`) as text adjacent to the Gravatar_Avatar
4. THE User_Section SHALL display a logout option below the avatar and name, styled consistently with navigation items (icon + "Logout" text label)
5. WHEN the user clicks the logout option, THE User_Section SHALL clear authentication state via `clearAuth()` and navigate to the login page
6. WHILE the viewport width is 1440px or greater, THE Content_Area SHALL NOT render the standalone User_Actions component (the top-right email/logout display SHALL be removed from the desktop Content_Area)

### Requirement 4: Mobile Full-Width Navigation Bar

**User Story:** As a mobile or tablet user, I want the navigation bar to span the full viewport width so that it integrates seamlessly as a top bar rather than floating as a card.

#### Acceptance Criteria

1. WHILE the viewport width is less than 1440px, THE Pill_Nav SHALL render as a full-width bar spanning the entire viewport width without rounded corners (no border-radius) and without horizontal margin
2. WHILE the viewport width is less than 1440px, THE Pill_Nav SHALL maintain sticky positioning at the top of the viewport, a fixed height of 56px (h-14), white background, and shadow
3. WHILE the viewport width is less than 1440px, THE Pill_Nav navigation items SHALL be left-aligned within the bar
4. WHILE the viewport width is less than 1440px, THE Pill_Nav SHALL display a user area right-aligned within the bar containing: a 40px circular Gravatar_Avatar and a logout icon button (icon only, no text label)
5. WHEN the user taps the mobile logout icon button, THE Pill_Nav SHALL clear authentication state via `clearAuth()` and navigate to the login page
6. WHILE the viewport width is less than 1440px, THE standalone User_Actions component SHALL NOT render (the user area is now integrated into the Pill_Nav bar)

### Requirement 5: User_Actions Component Removal from AppShell

**User Story:** As a developer, I want the standalone User_Actions rendering removed from AppShell so that user identity and logout are handled exclusively within the Pill_Nav at all breakpoints.

#### Acceptance Criteria

1. THE AppShell SHALL NOT render the User_Actions component at any breakpoint (neither the desktop top-right placement nor the mobile sticky bar placement)
2. THE Pill_Nav SHALL be the sole component responsible for rendering user identity (Gravatar_Avatar + name/logout) at all breakpoints
3. IF the user's profile data is unavailable (loading or error state), THEN THE User_Section SHALL hide the Gravatar_Avatar and first name while still displaying the logout option
