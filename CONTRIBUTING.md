# Contributing

This project is intentionally small, dependency-free, and privacy-first. Keep
changes aligned with that scope.

## Before You Open a Pull Request

Run the test suite from the repository root:

```bash
node --test
```

If you touched browser behavior, also verify the app in a browser on desktop
and mobile widths.

## What Fits This Project

- Small, focused improvements
- Documentation fixes that make the repository clearer to reuse
- Bug fixes in the existing browser app
- Test coverage for pure tracker logic

## What Does Not Fit

- Runtime dependencies
- Sign-in, syncing, or server features
- Third-party course materials, exam dumps, or question banks
- Personal data collection or analytics

## Pull Request Checklist

- Keep the scope narrow and easy to review
- Confirm the app still runs without external services
- Update the README if behavior or setup changes
- Avoid adding copyrighted or licensed material without permission

If you are unsure whether a change fits, open an issue first and describe the
goal in plain terms.
