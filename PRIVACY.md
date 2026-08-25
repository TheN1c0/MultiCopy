# Privacy Policy for MultiCopy

**Last Updated:** August 25, 2026

**MultiCopy** ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains our practices regarding user data.

---

### 1. No Data Collection or Transmission
MultiCopy **does not collect, store, track, sell, or transmit any personal data, browsing history, or sensitive information** to external servers or third parties. 

All operations, data parsing, and form autofilling occur **100% locally** within your browser.

---

### 2. Information Handled Locally
The extension handles the following data strictly within your local browser environment:

* **Spreadsheet & Clipboard Data:** When you explicitly click "Rellenar Formulario" or use the keyboard shortcut, MultiCopy reads the row data currently copied in your clipboard solely to populate the mapped form fields on your active tab. This data is processed in transient memory and is **never saved permanently or transmitted over the network**.
* **Configuration Profiles:** Custom form profile names, domain associations, column indices, and target element CSS selectors configured by the user are stored locally on your device via `chrome.storage.local`.
* **Active Tab Information:** The extension queries the active tab's URL only to suggest or load the corresponding local form profile.

---

### 3. Third-Party Services & Analytics
MultiCopy contains **no analytics, no telemetry, no tracking scripts, and no third-party advertising**. It makes zero network requests to external servers.

---

### 4. Permissions Usage
* **`storage`**: Used solely to save your custom form profiles locally on your computer.
* **`activeTab`**: Used strictly to interact with your currently open web page when you trigger autofill or profile configuration.
* **`scripting`**: Used to ensure form filler scripts are available on pre-existing open tabs without requiring manual page reload.
* **`clipboardRead`**: Used only on user demand to parse tabular data from your clipboard to fill form fields.
* **`<all_urls>`**: Required to allow the extension to function on any web form across websites chosen by the user.

---

### 5. Contact Us
If you have any questions about this Privacy Policy, please contact us at:
* **Website:** [https://bravo-bytes.com](https://bravo-bytes.com)
* **GitHub:** [https://github.com/TheN1c0/MultiCopy](https://github.com/TheN1c0/MultiCopy)
