# Health Workspace

A lightweight, browser-based personal health calculator. A guided onboarding collects the initial profile one question at a time, then presents **Overview, Measurements, Insights, and Reports together in one workspace**. Calculations and observations are shown only when supported by information the user entered.

**Deployment:** GitHub Pages  
**Runtime dependencies:** None  
**Storage:** Browser `localStorage` only  
**Build step:** None

## What is included

- Guided one-question-at-a-time onboarding with optional questions that can be skipped.
- Metric or imperial units selected during onboarding.
- One unified workspace with Overview, Measurements, Insights, and Reports sections.
- BMI, waist-to-height ratio, waist-to-hip ratio, Mifflin–St Jeor resting energy estimate, estimated daily energy expenditure, Mosteller body surface area, pulse pressure, and mean arterial pressure arithmetic.
- Charts only when at least two dated records exist for the same measurement; no sample data is inserted.
- Data-backed observations and printable/downloadable reports.
- A single **Reset** action that clears the locally stored profile and restarts onboarding.
- White interface with black controls and custom shadcn-inspired number steppers.
- Responsive layout for desktop and mobile.

There is no post-onboarding measurement editor or settings panel in this version. Users enter their initial information during onboarding. Reset returns them to that first question and clears the previous local profile.

## Run locally

The app uses native JavaScript modules. Serve the project over HTTP rather than opening `index.html` as a `file://` URL.

```bash
python -m http.server 4173
```

Then visit <http://localhost:4173>.

Or use Node.js:

```bash
npm run serve
```

## Deploy to GitHub Pages

1. Upload the contents of this folder to the repository root. Keep `.github/workflows/deploy.yml` and `.nojekyll`.
2. Push or commit the files to the `main` branch.
3. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
4. Open **Actions** and confirm the deployment workflow finishes successfully.
5. Visit the Pages URL shown in **Settings → Pages**.

The workflow runs the calculation tests and publishes the repository root. No build command, package installation, or secrets are required.

## Tests

The formula tests use Node's built-in test runner:

```bash
npm test
```

## Calculation notes and limitations

All body measurements are stored internally in metric units, regardless of the display units selected during onboarding.

- **BMI:** weight in kilograms divided by height in metres squared. Adult category labels are shown only from age 20. BMI is a screening measure, not a diagnosis.
- **Waist-to-height ratio:** waist circumference divided by height. NICE adult screening guidance is only applied when age is at least 18 and BMI is below 35.
- **Waist-to-hip ratio:** waist circumference divided by hip circumference from the same dated entry. No category is assigned.
- **Resting energy estimate:** Mifflin–St Jeor prediction using the selected equation coefficient. It is not a measured metabolic rate.
- **Daily energy estimate:** resting energy estimate multiplied by a conventional activity factor; it is a rough estimate, not a nutrition prescription.
- **Body surface area:** Mosteller formula, `sqrt(height_cm × weight_kg / 3600)`.
- **Pulse pressure:** systolic minus diastolic pressure from one paired entry.
- **Mean arterial pressure estimate:** `(systolic + 2 × diastolic) / 3` from one paired entry. Neither pressure calculation diagnoses or classifies blood pressure.

## Privacy and medical limitations

The app does not send measurements to a server. Data is stored in the current browser profile using `localStorage`. Local storage is not encrypted by this app and may be accessible to other people who use the same browser profile. Reset clears the app's locally stored profile.

This is an informational calculator, not a medical device or diagnostic tool, and it does not replace professional medical advice. Estimates depend on the accuracy of entered information. Do not use the app for urgent decisions or to change medication or treatment.

## License

MIT. See [LICENSE](./LICENSE).
