# Print Testing Protocol

Follow these steps to manually test browser-based document printing and layout safety.

## Testing Protocol

1. **Intake Flow Complete**:
   * Navigate to the Rent Agreement page, complete the wizard sections, and compile the mock draft instructions prompt.
   
2. **Access Preview Sheets**:
   * Open the generated draft preview page:
     👉 `http://localhost:3000/drafts/rent_agreement/preview`

3. **Verify Screen Elements**:
   * Confirm the page renders:
     * App headers and metadata grids.
     * Output validation cards and detailed consistency check lists.
     * Pre-print review warning notice.
     * Legal document preview sheet.
     * Action bars with buttons: **Back to Prompt Preview**, **Edit Draft Text**, and **Print Draft**.

4. **Verify Print Preview Layout**:
   * Click the **Print Draft** button (or press `Cmd+P` / `Ctrl+P`).
   * In the browser print dialog:
     * **Confirm only document text appears**: All UI headers, side navigation bar, buttons, warnings, and validation list cards must be hidden.
     * **Confirm draft formatting**: Lines, paragraphs, margins, and text spacing must look readable and neat.
     * **Save as PDF** or print to test output spacing.
