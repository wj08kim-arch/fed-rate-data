# fed-rate-data

Daily output of the Fed Rate Outlook model, published for the app.

- `latest.json` — most recent run (schema 1)
- `history/YYYY-MM-DD.json` — one file per day

Updated automatically every weekday around 07:00 KST.

Raw values of third-party FRED series (Moody's BAA spread, University of Michigan
sentiment and inflation expectations) are omitted; only derived scores are included.
Source data: FRED (Federal Reserve Bank of St. Louis) and federalreserve.gov.
Statistical estimates from historical data. Not investment advice.
