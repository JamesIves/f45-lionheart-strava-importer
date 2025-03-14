# F45 Lionheart Strava Importer

<!-- <img align="right" width="128" height="auto"  src="./.github/docs/icon.png" alt="Icon"> -->

This simple script pulls workout session data from the publicly available, yet undocumented, F45 Lionheart API and uploads it to Strava.

> [!IMPORTANT]
> In March of 2025 the official Lionheart -> Strava integration stopped working with no time commitment from F45 on when it will be fixed. As I want to be able to continue tracking my fitness progress in combination with my other training I built my own integration. I will maintain this functionality for as long as the official integration is broken, or until F45 turns off public access to their API.

## Getting Started

1. In your own private repository, create a `.github/workflows/upload.yml` file.
2. Add the following contents.

```yml
name: Import F45 Lionheart Data to Strava 📊

on:
  workflow_dispatch:
    inputs:
      CLASS_DATE:
        description: "F45 Class Date (YYYY-MM-DD)"
        required: true
        default: "2023-01-01"
      CLASS_TIME:
        description: "F45 Class Time (HH:MM)"
        required: true
        default: "09:30"
      STUDIO_CODE:
        description: "F45 Studio Code (e.g. '7bpy')"
        required: true
      USER_ID:
        description: "F45 User ID "
        required: true
        default: "<Your F45 User ID>"
      LIONHEART_SERIAL_NUMBER:
        description: "F45 Lionheart Serial Number"
        required: true
        default: "<Your Lionheart Serial Number>"

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: ".node-version"

      - name: Install Dependencies
        run: npm ci

      - name: Run Node.js script
        uses: JamesIves/f45-lionheart-strava-importer@main
        env:
          F45_CLASS_DATE: ${{ github.event.inputs.CLASS_DATE }}
          F45_STUDIO_CODE: ${{ github.event.inputs.STUDIO_CODE }}
          F45_USER_ID: ${{ github.event.inputs.USER_ID }}
          F45_LIONHEART_SERIAL_NUMBER: ${{ github.event.inputs.LIONHEART_SERIAL_NUMBER }}
          F45_CLASS_TIME: ${{ github.event.inputs.CLASS_TIME }}
          STRAVA_ACCESS_TOKEN: ${{ secrets.STRAVA_ACCESS_TOKEN }}
          STRAVA_REFRESH_TOKEN: ${{ secrets.STRAVA_REFRESH_TOKEN }}
          STRAVA_CLIENT_ID: ${{ secrets.STRAVA_CLIENT_ID }}
```

3. Go to `Settings -> Secrets and Variables -> Secrets`, add one for `STRAVA_ACCESS_TOKEN`, `STRAVA_REFRESH_TOKEN`, and `STRAVA_CLIENT_ID`. You can find what the values for these are by following the documentation found [here](https://developers.strava.com/docs/getting-started/). **These are basically credentials, do not store them directly in the workflow**.
4. Go to `Actions -> Import F45 Lionheart Data to Strava 📊 > Run Workflow`. Fill out all of the required data and run it.
5. If all the data was inputted correctly your workout will be uploaded to Strava very similarly to how it was using the official integration when it worked. Some things will be missing, such as the chart images but those are not trivial to add.

Alternatively you can follow the same steps as above but instead run the script locally with `npm run import`.

## Note

This script is in no way endorsed, associated, or affiliated with F45. I'm just an avid user and customer who misses their data.
