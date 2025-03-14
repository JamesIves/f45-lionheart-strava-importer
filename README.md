# F45 Lionheart Strava Importer

<!-- <img align="right" width="128" height="auto"  src="./.github/docs/icon.png" alt="Icon"> -->

This simple script pulls workout session data from the publicly available, yet undocumented, F45 Lionheart API and uploads it to Strava.

> [!IMPORTANT]
> In March of 2025 the official Lionheart -> Strava integration stopped working with no time commitment from F45 on when it will be fixed. As I want to be able to continue tracking my fitness progress in combination with my other training I built my own integration. I will maintain this functionality for as long as the official integration is broken, or until F45 turns off public access to their API.

## Getting Started

You can include the action in your workflow to trigger on a workflow_dispatch event, allowing you to decide what date and time to import. It's recommended that you store the other data points as a secret to maintain privacy.

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

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Run Node.js script
        uses: JamesIves/f45-lionheart-strava-importer@main
        with:
          F45_CLASS_DATE: ${{ github.event.inputs.CLASS_DATE }}
          F45_CLASS_TIME: ${{ github.event.inputs.CLASS_TIME }}
          F45_STUDIO_CODE: ${{ secrets.F45_STUDIO_CODE }}
          F45_USER_ID: ${{ secrets.F45_USER_ID }}
          F45_LIONHEART_SERIAL_NUMBER: ${{ secrets.F45_LIONHEART_SERIAL_NUMBER }}
          STRAVA_REFRESH_TOKEN: ${{ secrets.STRAVA_REFRESH_TOKEN }}
          STRAVA_CLIENT_SECRET: ${{ secrets.STRAVA_CLIENT_SECRET }}
          STRAVA_CLIENT_ID: ${{ secrets.STRAVA_CLIENT_ID }}
```

### Configuration 📁

The `with` portion of the workflow **must** be configured before the action will work. You can add these in the `with` section found in the examples above. Any `secrets` must be referenced using the bracket syntax and stored in the GitHub repository's `Settings/Secrets` menu. You can learn more about setting environment variables with GitHub actions [here](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets#creating-encrypted-secrets).

| Name                          | Secret | Description                                                              |
| ----------------------------- | ------ | ------------------------------------------------------------------------ |
| `F45_CLASS_DATE`              |        | The date of the F45 class, for example `2025-03-14`.                     |
| `F45_STUDIO_CODE`             | ✅     | The code of the F45 studio, for example `7bpf`.                          |
| `F45_USER_ID`                 | ✅     | The F45 user id..                                                        |
| `F45_LIONHEART_SERIAL_NUMBER` | ✅     | The serial number of the F45 Lionheart device that recorded the workout. |
| `F45_CLASS_TIME`              |        | The time of the F45 class, for example `09:30`.                          |
| `STRAVA_REFRESH_TOKEN`        | ✅     | The refresh token for the Strava API.                                    |
| `STRAVA_CLIENT_SECRET`        | ✅     | The client secret for the Strava API.                                    |
| `STRAVA_CLIENT_ID`            | ✅     | The client ID for the Strava API.                                        |

> [!NOTE]
> This script is in no way endorsed, associated, or affiliated with F45. I'm just an avid user and customer who misses their data.
