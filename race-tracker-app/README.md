# Race Tracker App - TODO List

## Project Setup
- [x] Create project structure
- [x] Initialize README.md

## Core Features to Implement

### 1. HTML Structure (`index.html`)
- [ ] Create main HTML file with semantic structure
- [ ] Add header with title "Uma Team Trials Tracker"
- [ ] Add action buttons (Add race, Upload screenshot, Export, Import, Reset, Copy Discord Table)
- [ ] Add legend showing badge colors and rules
- [ ] Create hidden entry panel for manual input (15 girl inputs + date)
- [ ] Create hidden review panel for OCR results (15 dropdowns)
- [ ] Add summary tables section (overall + distance groups)
- [ ] Include file input for image upload
- [ ] Link Tesseract.js CDN
- [ ] Link all CSS and JS files

### 2. CSS Styling (`css/styles.css` & `css/mobile.css`)
- [ ] Design responsive mobile-first layout
- [ ] Style header and navigation buttons with large tap targets (min 44x44px)
- [ ] Create badge styles for averages (🟩 green ≤1.5, 🟨 yellow 1.6–2.5, 🟥 red >2.5)
- [ ] Style entry panels (manual and OCR review)
- [ ] Design summary tables with clear visual hierarchy
- [ ] Add podium emoji styles (🥇/🥈/🥉)
- [ ] Implement loading/spinner animations for OCR processing
- [ ] Add error/success notification styles
- [ ] Ensure mobile-friendly spacing and typography
- [ ] Test responsive breakpoints

### 3. OCR Module (`js/ocr.js`)
- [ ] Initialize Tesseract.js worker
- [ ] Implement image upload handler
- [ ] Process uploaded image with OCR
- [ ] Parse OCR text for placement numbers (1st, 2nd, 3rd, etc.)
- [ ] Extract and normalize placement values (1-18)
- [ ] Handle OCR errors gracefully
- [ ] Show loading indicator during processing
- [ ] Return parsed results to UI for review

### 4. Storage Module (`js/storage.js`)
- [ ] Create localStorage wrapper functions
- [ ] Implement data structure for races (date, 15 girl placements)
- [ ] Save race results to localStorage
- [ ] Load all race history from localStorage
- [ ] Calculate running totals per girl
- [ ] Calculate averages per girl
- [ ] Count podiums (1st, 2nd, 3rd) per girl
- [ ] Count fails (4th+) per girl
- [ ] Implement data validation before saving
- [ ] Add reset/clear all data function

### 5. Export/Import Module (`js/export.js`)
- [ ] Export data to JSON format
- [ ] Trigger JSON file download
- [ ] Implement JSON file import
- [ ] Validate imported JSON structure
- [ ] Merge or replace existing data on import
- [ ] Generate Discord-formatted table
- [ ] Copy Discord table to clipboard
- [ ] Show success/error messages for export/import operations

### 6. UI Module (`js/ui.js`)
- [ ] Show/hide entry panels
- [ ] Populate manual entry form (15 inputs + date)
- [ ] Populate OCR review form with dropdowns (1-18 options)
- [ ] Validate placement inputs (must be 1-18, no duplicates optional)
- [ ] Handle "Add Race" button click
- [ ] Update summary tables after adding race
- [ ] Render overall summary table (Girl #, Races, Avg, Podiums, Fails)
- [ ] Apply badge colors to averages
- [ ] Render distance group summaries
- [ ] Handle button clicks (manual, upload, export, import, reset, copy)
- [ ] Show confirmation dialogs for destructive actions (reset)
- [ ] Display toast notifications
- [ ] Handle mobile touch interactions

### 7. Main App Module (`js/app.js`)
- [ ] Initialize application on page load
- [ ] Load existing data from storage
- [ ] Wire up all event listeners
- [ ] Coordinate between modules (OCR → UI → Storage → Export)
- [ ] Handle app state management
- [ ] Implement error boundaries

## Optional Enhancements

### PWA Features
- [ ] Create `manifest.json` for installability
- [ ] Add app icons (various sizes)
- [ ] Implement service worker for offline functionality
- [ ] Cache Tesseract.js and assets
- [ ] Add "Add to Home Screen" prompt

### Advanced Features
- [ ] Add edit/delete functionality for individual races
- [ ] Implement race history view with date filters
- [ ] Add data visualization (charts/graphs)
- [ ] Support custom girl names instead of numbers
- [ ] Add distance group configuration UI
- [ ] Implement undo/redo functionality
- [ ] Add dark mode toggle
- [ ] Support multiple teams/groups

## Testing & Polish
- [ ] Test on multiple mobile devices (iOS, Android)
- [ ] Test on different browsers (Chrome, Safari, Firefox)
- [ ] Verify OCR accuracy with sample screenshots
- [ ] Test all validation rules
- [ ] Test import/export with edge cases
- [ ] Verify localStorage limits aren't exceeded
- [ ] Add accessibility features (ARIA labels, keyboard navigation)
- [ ] Optimize performance (lazy loading, code splitting)
- [ ] Add helpful tooltips/instructions
- [ ] Create user documentation/help section

## Deployment
- [ ] Choose hosting solution (GitHub Pages, Netlify, Vercel, etc.)
- [ ] Set up deployment pipeline
- [ ] Test deployed version
- [ ] Share access link with users
- [ ] Gather user feedback

## Documentation
- [ ] Document data structure format
- [ ] Add code comments
- [ ] Create user guide with screenshots
- [ ] Document Discord table format requirements
- [ ] Add troubleshooting section

---

## Project Structure
```
race-tracker-app
├── index.html          # Main HTML file for the application
├── css
│   ├── styles.css     # Main styles for desktop and mobile views
│   └── mobile.css     # Styles specifically for mobile devices
├── js
│   ├── app.js         # Main JavaScript file for application logic
│   ├── ocr.js         # Handles OCR functionality with Tesseract.js
│   ├── storage.js     # Manages localStorage for data persistence
│   ├── export.js      # Provides JSON import/export functionality
│   └── ui.js          # Manages user interface interactions
├── assets
│   └── icons
│       └── camera.svg  # SVG icon for the upload button
└── README.md           # Documentation for the project
```

## Notes
- **Priority**: Focus on core features first (manual entry, storage, basic UI)
- **Data Privacy**: All processing happens client-side, no server needed
- **Mobile First**: Design for mobile, enhance for desktop
- **Validation**: Placements must be 1-18, date required