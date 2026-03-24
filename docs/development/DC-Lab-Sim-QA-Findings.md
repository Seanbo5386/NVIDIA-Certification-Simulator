# DC Lab Sim — QA & Testing Findings

**Project:** DC Lab Sim (NCP-AII Certification Exam Simulator)
**Version:** 1.3.0
**Date:** March 24, 2026
**Tester:** Claude (automated QA pass)
**Environment:** Vite dev server on Linux, Chrome browser

---

## Executive Summary

DC Lab Sim is a well-built, feature-rich certification exam simulator for the NVIDIA NCP-AII credential. The application is stable with no JavaScript runtime errors or React crashes encountered during testing. The dark theme UI is polished and professional, and the core learning flows — terminal simulation, exam gauntlet, narrative scenarios, and topology visualization — all function correctly. A small number of issues were found, mostly relating to content consistency, console noise, and one UX-blocking dialog pattern. The app is close to production-ready.

---

## Bugs

### BUG-001: Abort Button Uses Blocking `window.confirm()` Dialog (Severity: Medium)

**Location:** Lab Workspace → Abort button
**Steps to reproduce:**

1. Start any lab scenario in the Lab Workspace
2. Click the "Abort" button

**Expected behavior:** An in-app modal or confirmation dialog appears, styled consistently with the rest of the application.
**Actual behavior:** A native browser `window.confirm()` dialog appears. This is a blocking call that freezes the entire page thread. In automated testing and some browser configurations, this can cause the page to become completely unresponsive, requiring a full page reload to recover.

**Impact:** While a typical user clicking "OK" or "Cancel" will resolve the dialog, this is the only place in the app that uses a native browser dialog. It breaks the otherwise consistent in-app UI pattern. In edge cases (browser extensions, automated testing, accessibility tools), blocking dialogs can cause hangs.

**Recommendation:** Replace `window.confirm()` with a custom React modal component that matches the application's dark theme styling. This would be consistent with the pattern used elsewhere in the app (e.g., the exam submission confirmation).

---

### BUG-002: Content Count Discrepancy — "32 Missions" vs "28 Scenarios" (Severity: Low)

**Location:** Welcome/landing screen vs. About page
**Steps to reproduce:**

1. Load the application — the welcome screen displays "32 Missions"
2. Navigate to the About page — it references "28 Scenarios"

**Expected behavior:** Mission/scenario counts should be consistent across the application.
**Actual behavior:** The welcome screen says "32 Missions" and the About page says "28 Scenarios." The `narrativeScenarios.json` data file contains 32 entries, suggesting the welcome screen is correct and the About page is stale.

**Recommendation:** Update the About page to reflect the current count of 32 scenarios, or dynamically pull the count from the data source to prevent future drift.

---

## Console Noise (Non-Blocking)

### CONSOLE-001: Repeated Amplify Configuration Warnings (Severity: Low)

**Observed:** 6+ instances of `Amplify has not been configured correctly` per page load, appearing on every navigation event.

**Context:** This is expected in local development since AWS Amplify credentials are not configured in the dev environment. However, in production, these warnings should be suppressed or the Amplify initialization should be conditional.

**Recommendation:** Wrap Amplify initialization in an environment check (e.g., only initialize when `VITE_AMPLIFY_ENABLED=true` or when valid configuration exists). This will clean up the dev console and prevent any confusion during debugging.

### CONSOLE-002: Excessive Debug Logging for Scenario Context Clearing (Severity: Low)

**Observed:** Repeated duplicate log entries for scenario context clearing operations, appearing multiple times per navigation.

**Recommendation:** Remove or gate debug logging behind a `VITE_DEBUG` environment variable before production release. Excessive logging can obscure genuine issues during debugging and adds minor overhead.

---

## Feature Test Results

| Feature                            | Status             | Notes                                                                                                                                              |
| ---------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Terminal Simulator**             | PASS               | Commands execute correctly; invalid commands produce helpful error messages; tab completion works; command history (arrow keys) functions properly |
| **Lab Workspace (Guided Tier)**    | PASS               | Step-by-step instructions render correctly; progress tracking works; terminal accepts expected commands                                            |
| **Lab Workspace (Choice Tier)**    | PASS               | Reduced guidance works as designed; users must determine correct commands with less hand-holding                                                   |
| **Lab Workspace (Realistic Tier)** | PASS               | Minimal guidance; simulates real-world troubleshooting appropriately                                                                               |
| **Exam Gauntlet**                  | PASS               | Multiple exam modes available (Practice, Timed, Domain-specific); question rendering, answer selection, and scoring all function correctly         |
| **Which Tool Quiz**                | PASS               | Scenario-based tool selection quiz works; feedback on correct/incorrect answers is clear                                                           |
| **Narrative Scenarios**            | PASS               | Story-driven steps render properly; scenario progression works; all 32 scenarios accessible                                                        |
| **InfiniBand Topology Map**        | PASS               | D3.js fat-tree visualization renders correctly; interactive elements (hover, click) respond; node details display properly                         |
| **Fault Injection System**         | PASS               | Faults can be injected; effects propagate to dashboard metrics and topology visualization; fault indicators update in real-time                    |
| **Dashboard**                      | PASS               | Metrics cards render; GPU utilization, temperature, memory, and power data display; fault injection effects reflected                              |
| **Spaced Repetition (SM-2)**       | PASS               | Review scheduling visible; card difficulty ratings affect next review interval                                                                     |
| **Explanation Gates**              | PASS               | 56 gates accessible; gate content renders with proper formatting                                                                                   |
| **Navigation**                     | PASS               | Sidebar navigation works; all routes load without errors; back/forward browser navigation handled correctly                                        |
| **Authentication UI**              | PASS               | Login/signup forms render (Amplify not configured in dev, but UI layer functions)                                                                  |
| **About Page**                     | PASS (minor issue) | Content renders but scenario count is stale (see BUG-002)                                                                                          |
| **Settings**                       | PASS               | Settings panel accessible and functional                                                                                                           |
| **Responsive Layout**              | NOT FULLY TESTED   | Browser resize testing was limited by environment constraints; desktop layout is solid                                                             |

---

## UI/UX Analysis

### Strengths

**1. Consistent, Professional Dark Theme**
The dark background with NVIDIA green (#76B900) accent color is applied consistently throughout the application. It looks sharp, reduces eye strain for extended study sessions, and reinforces the NVIDIA/data center brand identity. Typography, spacing, and color contrast are well-executed.

**2. Excellent Terminal Simulation**
The xterm.js-based terminal is convincing and responsive. Command parsing, output formatting, tab completion, and error handling for invalid commands all contribute to a realistic CLI experience. The tiered progression from Guided → Choice → Realistic is a smart pedagogical design that gradually removes scaffolding.

**3. Strong Data Visualization**
The D3.js InfiniBand fat-tree topology map is a standout feature. It's interactive, visually clear, and provides meaningful insight into network fabric architecture. The fault injection system's real-time propagation to both the topology view and the dashboard metrics is particularly impressive — it ties abstract concepts to visual feedback.

**4. Well-Structured Exam System**
The exam gauntlet offers multiple study modes (practice, timed, domain-specific), which accommodates different learning styles. Question rendering is clean, and the scoring/review system provides useful feedback. The spaced repetition integration (SM-2 algorithm) adds genuine educational value beyond simple quiz repetition.

**5. Comprehensive Content Library**
32 narrative scenarios, 56 explanation gates, 6 command families, and a full exam question bank represent a substantial body of educational content. The breadth of coverage across GPU monitoring, InfiniBand, BMC hardware, cluster tools, containers, and diagnostics is thorough.

**6. Good Error Handling**
Invalid terminal commands produce helpful error messages rather than silent failures. Navigation errors are handled gracefully. No unhandled promise rejections or React error boundaries were triggered during testing.

**7. Thoughtful Learning Progression**
The 3-tier system (Guided → Choice → Realistic) is a well-considered approach to skill building. Starting with explicit step-by-step guidance and gradually removing support mirrors effective instructional design principles.

### Areas for Improvement

**1. Replace Native Browser Dialogs**
The `window.confirm()` usage on the Abort button is the most jarring UX inconsistency. Every other interaction in the app uses custom-styled components. A themed modal would maintain immersion and prevent potential page-freeze issues.

**2. Onboarding / First-Run Experience**
The application drops users into a content-rich interface without much guidance on where to start. A brief onboarding flow, suggested learning path, or "Start Here" prompt would help new users navigate the wealth of features. Consider a first-run tooltip tour highlighting the terminal, exam, scenarios, and topology map.

**3. Content Consistency Audit**
The "32 Missions" vs. "28 Scenarios" discrepancy (BUG-002) suggests that content counts may be hardcoded in multiple places. A sweep to ensure all references to content quantities are either dynamically sourced or manually synchronized would prevent user confusion.

**4. Console Cleanup for Production**
The Amplify warnings and debug logging, while harmless, would benefit from being gated behind environment variables. Clean console output in production signals polish and makes genuine issues easier to spot during monitoring.

**5. Loading States and Feedback**
Some transitions between views could benefit from subtle loading indicators or skeleton screens, particularly when navigating to content-heavy pages like the topology map or exam gauntlet. This would prevent any perception of lag on slower connections.

**6. Mobile / Responsive Considerations**
While full responsive testing was limited by the test environment, the terminal-heavy nature of the application inherently favors desktop use. If mobile support is a goal, consider a notice indicating the app is optimized for desktop, or implement responsive breakpoints for the sidebar and terminal layout.

**7. Keyboard Accessibility**
Tab-order navigation and keyboard shortcuts for power users (e.g., keyboard shortcuts to switch between lab, exam, and scenarios) would enhance usability, particularly for users who are comfortable with CLI-style interaction patterns.

---

## Summary of Findings

| Category                | Count                   |
| ----------------------- | ----------------------- |
| Bugs                    | 2                       |
| Console Issues          | 2                       |
| Features Tested         | 16                      |
| Features Passing        | 16 (1 with minor issue) |
| UX Strengths Identified | 7                       |
| UX Improvement Areas    | 7                       |
| JavaScript Errors       | 0                       |
| React Crashes           | 0                       |

---

## Production Readiness Assessment

**Overall Status: Near Production-Ready**

The application is functionally solid with no blocking bugs. The two bugs identified are low-to-medium severity and should be straightforward to fix. The console noise items are cleanup tasks rather than functional issues. The UX improvement suggestions are enhancements that would elevate the product but are not blockers for an initial release.

**Recommended pre-launch fixes (Priority 1):**

1. Replace `window.confirm()` with a custom modal (BUG-001)
2. Fix the scenario count discrepancy on the About page (BUG-002)
3. Gate Amplify initialization and debug logging behind environment checks

**Recommended enhancements (Priority 2):**

1. Add a first-run onboarding experience
2. Add loading states/skeleton screens for heavy views
3. Add a desktop-optimized notice or responsive breakpoints
4. Keyboard accessibility pass

---

_Document generated during automated QA testing session. All findings are based on manual interaction testing through a Chrome browser against the Vite development server._
