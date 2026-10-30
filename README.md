# TheHealthCalculator

A lightweight, private, browser-based health calculator. It collects measurements one question at a time, calculates only metrics supported by the information entered, and creates charts and plain-language observations only from dated user records.

**Live deployment target:** GitHub Pages  
**Runtime dependencies:** None  
**Storage:** Browser `localStorage` only  
**Build step:** None

## Features

- Guided onboarding with one question per screen; optional questions can be skipped.
- Metric and imperial display units (data is stored internally in metric units).
- Profile settings for age, height, activity level, and the selected Mifflin–St Jeor equation constant.
- Dated measurements for weight, waist, hips, blood pressure, resting heart rate, sleep duration, and exercise duration.
- Calculations: BMI, waist-to-height ratio, waist-to-hip ratio, Mifflin–St Jeor resting energy estimate, rough daily energy expenditure estimate, Mosteller body surface area, pulse pressure, and mean arterial pressure.
- Charts appear only when at least two dated records exist for the corresponding measurement.
- Insights and reports use only saved user data. No overall health score is generated.
- Edit/delete records, JSON backup/restore, CSV export, and printable reports.
- Light and dark themes, responsive layout, and a shadcn-inspired component style.
- Static, dependency-free deployment. No account, backend, analytics, external font, or third-party JavaScript is required.

## Run locally

The site uses native JavaScript modules, so open it through a local HTTP server rather than opening `index.html` as a `file://` URL.

### Python (already included with most systems)

```bash
python -m http.server 4173
```

Then visit <http://localhost:4173>.

### Node.js

```bash
npm run serve
```

Then visit <http://localhost:4173>.

## Deploy to GitHub Pages

1. Create a GitHub repository, for example `TheHealthCalculator`.
2. Upload the contents of this folder to the repository root. Keep the `.github/workflows/deploy.yml` file and `.nojekyll` file.
3. Push the files to the `main` branch.
4. In the repository, open **Settings → Pages**.
5. Under **Build and deployment → Source**, choose **GitHub Actions**.
6. Open the **Actions** tab. The workflow named **Deploy TheHealthCalculator to GitHub Pages** will publish the site after the push completes.
7. Open the Pages URL shown in **Settings → Pages**.

The workflow publishes the repository root directly; there is no Vite build, package installation, or secret configuration.

## Tests

The calculation and import-normalization tests use Node's built-in test runner:

```bash
npm test
```

No npm packages need to be installed. Node.js 20 or newer is recommended.

## Calculation notes and limitations

All stored body measurements are metric, regardless of the selected display units. The app does not backfill missing values or combine unrelated readings across different dates to create a paired calculation.

- **BMI:** weight in kilograms divided by height in metres squared. Adult category labels are shown only when the entered age is 20 or above. BMI is a screening measure, not a diagnosis, and can be misleading in some circumstances.
- **Waist-to-height ratio:** waist circumference divided by height. The NICE adult guidance is only used as a screening reference when age is at least 18 and BMI is below 35. No interpretation is applied when those conditions are not met.
- **Waist-to-hip ratio:** waist circumference divided by hip circumference from the same dated entry. A category is not assigned because interpretation depends on additional context.
- **Resting energy estimate:** Mifflin–St Jeor equation for ages 18 and above, using the user's selected equation constant. The male coefficient is `+5`, the female coefficient is `−161`, and `−78` is provided as an approximate midpoint option, not a validated individual equation. This is a prediction, not a measured metabolic rate.
- **Daily energy estimate:** resting energy estimate multiplied by a conventional activity factor. It is a rough estimate, not a personalised nutrition prescription.
- **Body surface area:** Mosteller formula, `sqrt(height_cm × weight_kg / 3600)`.
- **Pulse pressure:** systolic minus diastolic pressure from one entry containing both values.
- **Mean arterial pressure estimate:** `(systolic + 2 × diastolic) / 3` from one entry containing both values. Neither derived pressure is used to diagnose or classify blood pressure.

### References

- CDC, [Adult BMI Categories](https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html).
- NICE, [Identifying and assessing overweight, obesity and central adiposity](https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity).
- Mifflin et al. (1990), [A new predictive equation for resting energy expenditure in healthy individuals](https://pubmed.ncbi.nlm.nih.gov/2305711/).
- eviQ, [Body Surface Area Calculator and Mosteller formula](https://www.eviq.org.au/clinical-resources/eviq-calculators/3198-body-surface-area-calculator).

## Privacy

The app does not send measurements to a server. Data is stored in the current browser profile using `localStorage`. **Browser local storage is not encrypted by this app.** Anyone with access to the same browser profile or device may be able to access the information. Export a JSON backup before clearing browser data or moving to another device. Deleting browser storage, using a private browsing session, or changing browser profiles can remove or hide saved data.

## Medical disclaimer

TheHealthCalculator is an informational calculator, not a medical device, diagnostic tool, or substitute for professional medical advice. Formula outputs are estimates and depend on accurate user-entered information. Do not use this app for urgent decisions or to change medication or treatment. Speak with a qualified health professional about health concerns or medical decisions.

## License

MIT. See [LICENSE](./LICENSE).
