# F45 Lionheart Strava Importer

<!-- <img align="right" width="128" height="auto"  src="./.github/docs/icon.png" alt="Icon"> -->

This simple script pulls workout session data from the publicly available, yet undocumented, [F45 Lionheart](https://f45training.com/) API and uploads it to [Strava](https://strava.com/).

> [!NOTE]
> In March of 2025 the official Lionheart / Strava integration stopped working with no time commitment from F45 on when it will be fixed. As I want to be able to continue tracking my fitness progress in combination with my other training I built my own integration. I will maintain this functionality for myself for as long as the official integration is broken, or until F45 turns off public access to their API.
>
> [You can learn about my inspiration for this project here](https://jamesiv.es/blog/experiment/javascript/2025/03/14/f45-broke-my-beloved-strava-integration).

## Getting Started

You can include the action in your workflow to trigger on a workflow_dispatch event, allowing you to decide what date and time to import. It's recommended that you store the other data points as a secret to maintain privacy.

```yml
name: Import F45 Lionheart Data to Strava 📊

on:
  workflow_dispatch:
    inputs:
      F45_CLASS_DATE:
        description: "The date of the F45 class you want to import (YYYY-MM-DD)"
        required: true
        default: "2023-01-01"
      F45_CLASS_TIME:
        description: "The time the class was scheduled that you want to import (HH:MM), 24-hour format"
        required: true
        default: "09:30"
      F45_STUDIO_CODE:
        description: "Override the stored environment variable for the studio code. This is useful if passporting at another studio."

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Run Node.js script
        uses: JamesIves/f45-lionheart-strava-importer@main
        with:
          F45_CLASS_DATE: ${{ github.event.inputs.F45_CLASS_DATE }}
          F45_CLASS_TIME: ${{ github.event.inputs.F45_CLASS_TIME }}
          F45_STUDIO_CODE: ${{ secrets.F45_STUDIO_CODE }}
          F45_USER_ID: ${{ secrets.F45_USER_ID }}
          F45_LIONHEART_SERIAL_NUMBER: ${{ secrets.F45_LIONHEART_SERIAL_NUMBER }}
          STRAVA_REFRESH_TOKEN: ${{ secrets.STRAVA_REFRESH_TOKEN }}
          STRAVA_CLIENT_SECRET: ${{ secrets.STRAVA_CLIENT_SECRET }}
          STRAVA_CLIENT_ID: ${{ secrets.STRAVA_CLIENT_ID }}
```

### Configuration 📁

The `with` portion of the workflow **must** be configured before the action will work. You can add these in the `with` section found in the examples above. Any `secrets` must be referenced using the bracket syntax and stored in the GitHub repository's `Settings/Secrets` menu. You can learn more about setting environment variables with GitHub actions [here](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets#creating-encrypted-secrets).

> [!CAUTION]
> Some of the data required for this to work is not easy to come by. In other words, typical F45 users would not need to know their studio code, nor would they need to know their user id. [I'd recommend following how I got this data here](https://jamesiv.es/blog/experiment/javascript/2025/03/14/f45-broke-my-beloved-strava-integration).

| Name                          | Secret | Description                                                                                                                                                                     |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `F45_CLASS_DATE`              |        | The date of the F45 class you want to import (YYYY-MM-DD), for example `2025-03-12`.                                                                                            |
| `F45_CLASS_TIME`              |        | The time the class was scheduled that you want to import (HH:MM), 24-hour format. For example `17:30` or `09:30`. You'll find this time in the F45 app when you book the class. |
| `F45_STUDIO_CODE`             | ✅     | The code of the F45 studio where the class took place, for example `7bpf`. You can store this as an environment variable and override it via an input when passporting.         |
| `F45_USER_ID`                 | ✅     | The F45 user ID who took the class.                                                                                                                                             |
| `F45_LIONHEART_SERIAL_NUMBER` | ✅     | The serial number of the F45 Lionheart device that recorded the workout. This can be found on the back of the heartrate monitor puck.                                           |
| `STRAVA_REFRESH_TOKEN`        | ✅     | The refresh token for the Strava API. [Click here for details on how to get this data](https://developers.strava.com/docs/getting-started/).                                    |
| `STRAVA_CLIENT_SECRET`        | ✅     | The client secret for the Strava API. [Click here for details on how to get this data](https://developers.strava.com/docs/getting-started/)                                     |
| `STRAVA_CLIENT_ID`            | ✅     | The client ID for the Strava API. [Click here for details on how to get this data](https://developers.strava.com/docs/getting-started/)                                         |

### Disclaimer 📜

This script is in no way endorsed, associated, or affiliated with F45. I'm just an avid user and customer who misses their data.
