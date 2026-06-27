# GoalHorizon Frontend | React & Vite Dashboard

This directory houses the frontend Single Page Application (SPA) for **GoalHorizon**, built using React, Vite, and Chart.js.

It compiles into highly optimized static assets (served from `dist/`) which are distributed by the Express backend, or can be run independently using the Vite development server.

---

## 🎨 Design System & Aesthetics

The UI utilizes a **premium dark-mode dashboard** design configured via CSS custom variables in [index.css](src/index.css):
*   **Color Palette**: Deep slate background (`#0b0f19`), rich dark blue cards (`rgba(22, 33, 59, 0.7)`), accompanied by emerald, amber, and rose status accents.
*   **Typography**: Outfitted with modern Google Fonts (*Plus Jakarta Sans* and *Outfit*) avoiding default system typography.
*   **Glow & Glassmorphism**: Cards feature subtle border back-lighting (`rgba(255,255,255,0.08)`) and high-blur backdrops for premium depth.
*   **Micro-Animations**: Hover scales, slider-thumb enlargements, and fade-in entry states.

---

## ⚙️ Core Dashboard Modules

1.  **Form Input Panel**: Collects goal details (target cost, timeline, current savings rate). Fully supports blank backspaces without throwing calculation freezes.
2.  **Interactive Economic Sandbox**: Real-time sliders allow immediate adjustment of expected returns and inflation rates. Updates the rest of the UI instantly via local React states.
3.  **Outcome Metrics Grid**: Renders Conservative, Moderate, and Optimistic cards showing:
    *   Inflated Target Cost
    *   Future Compounded Savings (Annuity Due)
    *   Feasibility ratio and status badges
    *   Required monthly savings to cover the final target cost.
4.  **Multi-Curve Charting Canvas**: Plotted using `react-chartjs-2` to map the 3 savings growth pathways against the inflating cost curves.
5.  **Deficit Financing (Loan EMI Calculator)**: Displays if a funding deficit exists, helping users calculate loan terms (tenure, rate, monthly EMI, and total interest) needed to bridge the gap.
6.  **Simulation History Logs**: Table showcasing past runs with selection checkboxes for single or bulk log elimination.
7.  **Portfolio Analytics Profile Modal**: Triggered by clicking the User icon. Loads aggregate statistics (average timeline, average yield, success rate bar segmentation) via protected API calls.

---

## 🛠️ CLI Reference

Navigate to the `frontend/` directory to run these commands:

### Development Dev Server
```bash
npm run dev
```
Starts the Vite dev server on `http://localhost:3000`. 
API requests matching `/api/*` are automatically proxied to the Express backend port `5200` to prevent CORS issues (configured in `vite.config.js`).

### Production Build
```bash
npm run build
```
Compiles the application into production-grade, minified assets located in `frontend/dist/`.

### Preview Build
```bash
npm run preview
```
Runs a local server to preview the compiled build locally.
