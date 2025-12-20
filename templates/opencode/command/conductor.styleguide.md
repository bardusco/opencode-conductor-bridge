---
description: Access language-specific code styleguides bridged from Conductor
---

# Conductor Styleguide

This command provides access to the official code styleguides from Gemini Conductor.

### Available Styleguides
- general
- go
- html-css
- javascript
- python
- typescript

### Instructions
1. **Identify Language:** Determine which language the user is interested in (e.g., from the command arguments or context).
2. **Fetch Rules:** Read the specific styleguide rules from the following path:
   - `{{CONDUCTOR_ROOT}}/templates/code_styleguides/<language>.md`
3. **Apply:** Use these rules for all code generation, refactoring, or review tasks.
4. **Apply Mode:** If the user specifically asks to *apply* a styleguide to the current file or context, summarize the most relevant rules from the file and explain how they apply to the current code.
5. **No Language?** If the user didn't specify a language, list the available options above and ask which one they need.

> [!NOTE]
> These guides are bridged from Gemini Conductor.
> **Source Directory:** [templates/code_styleguides](https://github.com/gemini-cli-extensions/conductor/tree/b49d77058ccd5ccedc83c1974cc36a2340b637ab/templates/code_styleguides)

<!-- conductor-bridge-metadata:
  origin: templates/code_styleguides
  origin_sha: b49d77058ccd5ccedc83c1974cc36a2340b637ab
  available_languages: general, go, html-css, javascript, python, typescript
-->
