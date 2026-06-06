# Requirements Document

## Introduction

A responsive layout system for My Time Blocks that replaces the current flex-based sidebar layout with a 12-column grid, fixed-width containers that snap at breakpoints, a floating pill navigation, responsive activity blocks, and a dotted background pattern. The system provides a consistent spatial framework across five breakpoints.

## Glossary

- **Layout_System**: The root layout component that manages the grid container, navigation, content area, and background pattern
- **Grid_Container**: A horizontally centered, fixed-width wrapper that snaps to predefined widths at each breakpoint
- **Pill_Nav**: A rounded-rectangle navigation card containing icon-based or icon+label navigation items; renders vertically on desktop, horizontally on mobile/tablet
- **Activity_Block**: A clickable time-tracking block rendered as a square (desktop/tablet) or 2:1 rectangle (mobile)
- **Content_Area**: The region within the grid where page content (activity blocks, entries) is rendered
- **Block_Grid**: A nested grid within the Content_Area that arranges Activity_Blocks in rows
- **Breakpoint**: A viewport width threshold where the layout snaps to a new container size and configuration
- **Gutter**: The horizontal gap between grid columns
- **User_Actions**: The profile display and logout control, rendered outside the Pill_Nav

## Requirements

### Requirement 1: Grid Container

**User Story:** As a user, I want the app content to be centered in a fixed-width container so that the layout feels structured and consistent across different screen sizes.

#### Acceptance Criteria

1. THE Grid_Container SHALL use a 12-column grid with columns of equal width
2. THE Grid_Container SHALL be horizontally centered within the viewport with equal margins on both sides when the viewport is wider than the container width
3. WHILE the viewport width is at least 768px but less than 1024px, THE Grid_Container SHALL render at 720px width with 16px gutters between columns
4. WHILE the viewport width is at least 1024px but less than 1440px, THE Grid_Container SHALL render at 960px width with 20px gutters between columns
5. WHILE the viewport width is at least 1440px but less than 1920px, THE Grid_Container SHALL render at 1200px width with 24px gutters between columns
6. WHILE the viewport width is 1920px or greater, THE Grid_Container SHALL render at 1440px maximum width with 24px gutters between columns
7. WHILE the viewport width is at least 360px but less than 768px, THE Grid_Container SHALL render at 360px width with 12px gutters between columns
8. IF the viewport width is less than 360px, THEN THE Grid_Container SHALL render at 100% of the viewport width with 12px gutters between columns, without horizontal overflow or scrollbar
9. THE Grid_Container SHALL snap immediately to the new width at each breakpoint without CSS transition or animation

### Requirement 2: Desktop Navigation

**User Story:** As a desktop user, I want a floating vertical navigation so that I can access app sections without losing content space.

#### Acceptance Criteria

1. WHILE the viewport width is 1440px or greater, THE Pill_Nav SHALL render as a vertical floating card fixed-positioned and vertically centered within the left 3 columns of the Grid_Container
2. WHILE the viewport width is 1440px or greater, THE Pill_Nav SHALL display each navigation item with an icon and a text label
3. THE Pill_Nav SHALL render as a white rounded-rectangle card with rounded corners
4. THE Pill_Nav SHALL display navigation items in order: Timer (route: /), Entries (route: /entries), Projects (route: /projects), Team (route: /team), Reports (route: /reports)
5. WHILE a navigation item is disabled, THE Pill_Nav SHALL render the item at 60% opacity with pointer-events disabled so that the item is visible but non-interactive
6. WHEN a user clicks an enabled navigation item, THE Pill_Nav SHALL navigate to that item's corresponding route and visually indicate the active item with a highlighted background distinguishable from inactive items

### Requirement 3: Mobile and Tablet Navigation

**User Story:** As a mobile or tablet user, I want a compact horizontal navigation at the top so that I can switch sections without it taking too much screen space.

#### Acceptance Criteria

1. WHILE the viewport width is less than 1440px, THE Pill_Nav SHALL render as a horizontal bar at the top of the viewport with a fixed height of 56px
2. WHILE the viewport width is less than 1440px, THE Pill_Nav SHALL be sticky-positioned at the top of the viewport so it remains visible during scrolling, layered above page content
3. WHILE the viewport width is less than 1440px, THE Pill_Nav SHALL display each navigation item as an icon-only button (using the same lucide icons as the desktop nav) without a text label, with a minimum tap target size of 44×44px
4. THE Pill_Nav SHALL maintain the white rounded-rectangle card style in both horizontal and vertical orientations
5. WHEN a user taps an enabled navigation item, THE Pill_Nav SHALL navigate to the corresponding route and indicate the active item with the same visual treatment used in the desktop nav (highlighted background and prominent text color)
6. WHILE a navigation item is disabled, THE Pill_Nav SHALL render it with reduced opacity and SHALL NOT navigate on tap

### Requirement 4: Content Area Layout

**User Story:** As a user, I want the content area to adapt based on screen size so that activity blocks and other content use available space effectively.

#### Acceptance Criteria

1. WHILE the viewport width is 1440px or greater, THE Content_Area SHALL start at grid-column 4 and span columns 4–12 (9 columns) of the Grid_Container, with columns 1–3 reserved as empty space for the fixed-positioned Pill_Nav
2. WHILE the viewport width is less than 1440px, THE Content_Area SHALL span all 12 columns of the Grid_Container
3. WHILE the viewport width is less than 1440px, THE Content_Area SHALL render below the sticky Pill_Nav with sufficient top padding to ensure no content is hidden behind the sticky-positioned navigation (at minimum 56px + 16px)
4. WHILE the viewport width is 1440px or greater, THE Content_Area SHALL align to the top of the Grid_Container without additional top offset (Pill_Nav is fixed-positioned and not in document flow)

### Requirement 5: Activity Block Sizing

**User Story:** As a user, I want activity blocks to be appropriately sized at each breakpoint so that they are easy to tap and read.

#### Acceptance Criteria

1. THE Content_Area SHALL contain a Block_Grid — a nested CSS grid that arranges Activity_Blocks independently from the 12-column layout grid
2. WHILE the viewport width is less than 768px, THE Block_Grid SHALL render 1 column and THE Activity_Block SHALL use a 2:1 width-to-height aspect ratio
3. WHILE the viewport width is between 768px and 1023px, THE Block_Grid SHALL render 2 columns and THE Activity_Block SHALL use a 1:1 (square) aspect ratio
4. WHILE the viewport width is between 1024px and 1439px, THE Block_Grid SHALL render 3 columns and THE Activity_Block SHALL use a 1:1 aspect ratio
5. WHILE the viewport width is between 1440px and 1919px, THE Block_Grid SHALL render 3 columns within the 9-column Content_Area and THE Activity_Block SHALL use a 1:1 aspect ratio
6. WHILE the viewport width is 1920px or greater, THE Block_Grid SHALL render 4 columns within the 9-column Content_Area and THE Activity_Block SHALL use a 1:1 aspect ratio
7. THE Block_Grid SHALL use the same gutter value as the Grid_Container at the current breakpoint for the gap between blocks
8. THE Activity_Block SHALL maintain a minimum tap target size of 44×44px at all breakpoints

### Requirement 6: Background Pattern

**User Story:** As a user, I want a subtle dotted background so that the interface has visual texture and depth without being distracting.

#### Acceptance Criteria

1. THE Layout_System SHALL render a background using the neutral color grey-lightest (#f6f6f6) with dots in grey-light (#e2e2e2) behind the Grid_Container
2. THE Layout_System SHALL implement the dot pattern using a CSS radial-gradient with circular dots of 1px radius spaced 20px apart (both horizontally and vertically)
3. THE Layout_System SHALL apply the background pattern to the full page area outside and behind the Grid_Container
4. THE Layout_System SHALL ensure the dot pattern remains behind all content by applying the background to the page body or outermost wrapper element without overlaying any interactive or text elements

### Requirement 7: Responsive Font Sizing in Blocks

**User Story:** As a user, I want text in activity blocks to remain legible at every breakpoint so that I can read timer values and labels without difficulty.

#### Acceptance Criteria

1. WHILE the viewport width is 768px or greater, THE Activity_Block SHALL render the tag badge at text-xs (12px), the project name at text-sm (14px), the activity name at text-2xl (24px) with line-clamp-2, and the timer display at text-4xl (36px) font-mono.
2. WHILE the viewport width is less than 768px, THE Activity_Block SHALL render the tag badge at text-xs (12px), the project name at text-xs (12px), the activity name at text-lg (18px) with line-clamp-1, and the timer display at text-2xl (24px) font-mono.
3. THE Activity_Block SHALL constrain all text elements within the block boundaries using truncation (single-line elements) or line-clamp (multi-line elements) so that no text overflows the block width or height at any breakpoint.
4. WHILE the viewport width is less than 768px, THE Activity_Block SHALL reduce internal padding from 24px (p-6) to 16px (p-4) to preserve space for text content within the 2:1 rectangular layout.

### Requirement 8: Tailwind Theme Integration

**User Story:** As a developer, I want the layout breakpoints and container widths defined in Tailwind's @theme so that all layout values are centralized and consistent.

#### Acceptance Criteria

1. THE Layout_System SHALL define container widths (360px, 720px, 960px, 1200px, 1440px) as named custom properties (--container-xs, --container-sm, --container-md, --container-lg, --container-xl) in the @theme block of the project's main CSS file
2. THE Layout_System SHALL define gutter sizes (12px, 16px, 20px, 24px) as named custom properties (--spacing-gutter-xs, --spacing-gutter-sm, --spacing-gutter-md, --spacing-gutter-lg) in the @theme block of the project's main CSS file
3. THE Layout_System SHALL define custom breakpoints (768px, 1024px, 1440px, 1920px) as --breakpoint-tablet, --breakpoint-desktop, --breakpoint-wide, --breakpoint-ultrawide in the @theme block, WHILE retaining the default Tailwind breakpoints (sm, md, lg, xl, 2xl) so existing component classes continue to work
4. THE Layout_System SHALL reference theme-defined tokens via Tailwind utility classes and SHALL NOT use arbitrary value syntax (square-bracket notation) for any value that corresponds to a defined theme token in component markup (.tsx files)

### Requirement 9: User Actions Placement

**User Story:** As a user, I want to see my profile and access logout without it cluttering the navigation, so that the nav remains focused on page navigation.

#### Acceptance Criteria

1. WHILE the viewport width is 1440px or greater, THE User_Actions (profile email display and logout button) SHALL render in the top-right corner of the Content_Area, independent of the Pill_Nav
2. WHILE the viewport width is less than 1440px, THE User_Actions SHALL render within the sticky top bar alongside the Pill_Nav but visually separated (e.g., right-aligned while nav items are centered)
3. THE User_Actions SHALL display a logout button that clears auth state and navigates to the login page
4. THE User_Actions SHALL optionally display the user's email address when viewport width is 768px or greater, hidden on mobile to save space
