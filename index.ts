import fs from "fs";
import { create } from "xmlbuilder2";
import dotenv from "dotenv";
import FormData from "form-data";
import fetch from "node-fetch";
import { getInput } from "@actions/core";

/**
 * Load environment variables from a .env file.
 */
dotenv.config();

/**
 * Utility function that checks to see if a value is undefined or not.
 * If allowEmptyString is passed the parameter is allowed to contain an empty string as a valid parameter.
 */
export const isNullOrUndefined = (
  value: unknown
): value is undefined | null | "" =>
  typeof value === "undefined" || value === null || value === "";

/**
 * The Strava client ID.
 * This can be found in the Strava API settings.
 */
const STRAVA_CLIENT_ID = !isNullOrUndefined(getInput("STRAVA_CLIENT_ID"))
  ? getInput("STRAVA_CLIENT_ID")
  : process.env.STRAVA_CLIENT_ID;

/**
 * The Strava client secret.
 * This can be found in the Strava API settings.
 */
const STRAVA_CLIENT_SECRET = !isNullOrUndefined(
  getInput("STRAVA_CLIENT_SECRET")
)
  ? getInput("STRAVA_CLIENT_SECRET")
  : process.env.STRAVA_CLIENT_SECRET;

/**
 * The Strava refresh token.
 * You can get this by following the Strava API documentation: https://developers.strava.com/docs/getting-started/
 */
const STRAVA_REFRESH_TOKEN = !isNullOrUndefined(
  getInput("STRAVA_REFRESH_TOKEN")
)
  ? getInput("STRAVA_REFRESH_TOKEN")
  : process.env.STRAVA_REFRESH_TOKEN;

/**
 * The F45 Studio Code.
 */
const STUDIO_CODE = !isNullOrUndefined(getInput("F45_STUDIO_CODE"))
  ? getInput("F45_STUDIO_CODE")
  : process.env.F45_STUDIO_CODE;

/**
 * The F45 User ID.
 */
const USER_ID = !isNullOrUndefined(getInput("F45_USER_ID"))
  ? getInput("F45_USER_ID")
  : process.env.F45_USER_ID;

/**
 * The F45 Lionheart Serial Number.
 */
const LIONHEART_SERIAL_NUMBER = !isNullOrUndefined(
  getInput("F45_LIONHEART_SERIAL_NUMBER")
)
  ? getInput("F45_LIONHEART_SERIAL_NUMBER")
  : process.env.F45_LIONHEART_SERIAL_NUMBER;

/**
 * If true, the script will not upload the workout to Strava.
 * This is useful for testing the script without actually uploading the workout.
 */
const DRY_RUN = !isNullOrUndefined(getInput("DRY_RUN"))
  ? getInput("DRY_RUN").toLowerCase() === "true"
  : false;

/**
 * The Strava token endpoint.
 */
const STRAVA_TOKEN_ENDPOINT = "https://www.strava.com/api/v3/oauth/token";

/**
 * The Strava upload endpoint.
 * Docs: https://developers.strava.com/docs/reference/#api-Uploads-createUpload
 */
const STRAVA_UPLOAD_ENDPOINT = "https://www.strava.com/api/v3/uploads";

/**
 * Interface for the JSON data returned by the Lionheart Session API.
 * This describes the workout data including heart rate, calories, and more.
 * This data is pulled to generate the TCX file.
 */
interface ILionheartSession {
  status: number;
  success: boolean;
  data: {
    sessionId: string;
    version: {
      tag: string;
      major: number;
      minor: number;
      patch: number;
    };
    studio: {
      studioId: number;
      name: string;
      code: string;
      timezone: string;
    };
    workout: {
      name: string;
      displayName: string;
      type: {
        id: number;
        name: string;
      };
      logo: {
        url: string;
        dimensions: string;
        width: number;
        height: number;
      };
      description: string;
    };
    classInfo: {
      localizedDateTime: string;
      date: string;
      time: string;
      timestamp: number;
      timezone: string;
      durationInMinutes: number;
    };
    summary: {
      points: number;
      heartrate: {
        average: number;
        max: number;
      };
      estimatedCalories: number;
      trackedDurationInSeconds: number;
    };
    heartrate: {
      calculationMethod: {
        id: number;
        name: string;
      };
      inputs: {
        maxHR: {
          default: number;
          override: number;
          value: number;
        };
        restingHR: {
          default: number;
          override: number;
          value: number;
        };
      };
      zones: {
        zoneId: number;
        name: string;
        description: string;
        colorHex: string;
        minPercentage: number;
        maxPercentage: number;
        minBpm: number;
        maxBpm: number;
        bpmLabel: string;
        computedDuration: {
          seconds: number;
          label: string;
        };
        computedPercentage: {
          value: number;
          label: string;
        };
      }[];
    };
    graph: {
      type: string;
      timeSeries: {
        minute: number;
        type: string;
        bpm?: {
          min: number;
          max: number;
        };
      }[];
    };
  };
}

/**
 * Interface for the JSON data returned by the Lionheart Profile API.
 */
interface ILionheartProfile {
  status: number;
  success: boolean;
  data: {
    summary: {
      allTime: TimeframeSummary;
      year: TimeframeSummary;
      quarter: TimeframeSummary;
      month: TimeframeSummary;
      week: TimeframeSummary;
    };
  };
}

/**
 * Interface for the TimeframeSummary object.
 */
interface TimeframeSummary {
  timeframe: {
    id: number;
    name: string;
    numberOfDays: number | null;
  };
  sessionCount: number;
  averagePoints: number;
  averageCalories: number;
  maxPoints: number;
}

/**
 * Interface for the Strava token response.
 */
interface IStravaTokenResponse {
  access_token: string;
}

/**
 * Interface for the Strava upload parameters.
 */
interface IStravaUploadParameters {
  file?: string;
  name: string;
  description: string;
  data_type: string;
  trainer?: string;
  commute?: string;
  external_id?: string;
}

/**
 * Gets a new access token from Strava, allowing us to make an API request.
 */
const getAccessToken = async (): Promise<IStravaTokenResponse> => {
  try {
    const response = await fetch(STRAVA_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: STRAVA_REFRESH_TOKEN,
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error fetching access token: ${response.statusText}`);
    }

    return response.json() as Promise<IStravaTokenResponse>;
  } catch (error) {
    console.error(`Failed to get access token: ${error} ❌`);
    throw error;
  }
};

/**
 * Uploads a TCX file to Strava.
 * The TCX file contains all of the information about the workout
 * including graph data, heart rates, and more.
 */
async function uploadTcxFile(
  accessToken: string,
  filePath: string,
  data: IStravaUploadParameters
) {
  try {
    const file = fs.createReadStream(filePath);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("data_type", data.data_type);

    const response = await fetch(STRAVA_UPLOAD_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Error uploading TCX file: ${response.statusText} - ${errorBody}`
      );
    }

    return response.json();
  } catch (error) {
    console.error(`Failed to upload TCX file: ${error} ❌`);
    throw error;
  }
}

/**
 * Saves the TCX file to the file system.
 */
function saveTcxFile(tcxData: string, filePath: string) {
  try {
    fs.writeFileSync(filePath, tcxData);
  } catch (error) {
    console.error(`Failed to save TCX file: ${error} ❌`);
    throw error;
  }
}

/**
 * Fetches the workout session from the Lionheart API.
 */
async function fetchLionheartSession(): Promise<ILionheartSession | null> {
  const CLASS_DATE = !isNullOrUndefined(getInput("F45_CLASS_DATE"))
    ? getInput("F45_CLASS_DATE")
    : process.env.F45_CLASS_DATE;

  let CLASS_TIME = !isNullOrUndefined(getInput("F45_CLASS_TIME"))
    ? getInput("F45_CLASS_TIME")
    : process.env.F45_CLASS_TIME;

  if (CLASS_TIME) {
    CLASS_TIME = CLASS_TIME.replace(":", "");
  }

  try {
    const url = `https://api.lionheart.f45.com/v3/sessions/${CLASS_DATE}_${CLASS_TIME}:studio:${STUDIO_CODE}:serial:${LIONHEART_SERIAL_NUMBER}?user_id=${USER_ID}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Error fetching data from Lionheart API: ${response.statusText}`
      );
    }

    const data = (await response.json()) as ILionheartSession;

    return data;
  } catch (error) {
    console.error(
      `Failed to fetch data from Lionheart Session API: ${error} ❌`
    );
    return null;
  }
}

/**
 * Fetches the users profile data from the Lionheart API.
 */
async function fetchLionheartProfile(): Promise<ILionheartProfile | null> {
  try {
    const url = `https://api.lionheart.f45.com/v3/profile/sessions/summary?user_id=${USER_ID}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Error fetching data from Lionheart API: ${response.statusText}`
      );
    }

    const data = (await response.json()) as ILionheartProfile;

    return data;
  } catch (error) {
    console.error(
      `Failed to fetch data from Lionheart Profile API: ${error} ❌`
    );
    return null;
  }
}

/**
 * Reformats the fetched data as a TCX file.
 */
function generateTcx(res: ILionheartSession): string {
  try {
    const { summary, graph } = res.data;
    const startTime = new Date(res.data.classInfo.timestamp * 1000);

    const root = create({ version: "1.0" })
      .ele("TrainingCenterDatabase", {
        xmlns: "http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2",
      })
      .ele("Activities")
      .ele("Activity", { Sport: "AlpineSki" })
      .ele("Id")
      .txt(startTime.toISOString())
      .up()
      .ele("Lap", { StartTime: startTime.toISOString() })
      .ele("TotalTimeSeconds")
      .txt((res.data.classInfo.durationInMinutes * 60).toString())
      .up()
      .ele("DistanceMeters")
      .txt("0")
      .up()
      .ele("Calories")
      .txt(summary.estimatedCalories.toString())
      .up()
      .ele("AverageHeartRateBpm")
      .ele("Value")
      .txt(summary.heartrate.average.toString())
      .up()
      .up()
      .ele("MaximumHeartRateBpm")
      .ele("Value")
      .txt(summary.heartrate.max.toString())
      .up()
      .up()
      .ele("Intensity")
      .txt("Active")
      .up()
      .ele("TriggerMethod")
      .txt("Manual")
      .up()
      .ele("Track");

    graph.timeSeries.forEach((entry) => {
      if (entry.type === "recordedBpm") {
        const timePoint = new Date(startTime.getTime() + entry.minute * 60000);
        if (entry.bpm) {
          root
            .ele("Trackpoint")
            .ele("Time")
            .txt(timePoint.toISOString())
            .up()
            .ele("HeartRateBpm")
            .ele("Value")
            .txt(entry.bpm.max.toString())
            .up()
            .up();
        }
      }
    });

    return root.end({ prettyPrint: true });
  } catch (error) {
    console.error(`Error generating TCX file: ${error} ❌`);
    throw error;
  }
}

/**
 * Main function that orchestrates the entire process.
 */
async function main(): Promise<void> {
  const tokenResponse: {
    access_token: string;
  } = await getAccessToken();
  const session: ILionheartSession | null = await fetchLionheartSession();
  const profile: ILionheartProfile | null = await fetchLionheartProfile();

  if (session) {
    const tcxData = generateTcx(session);
    const workoutName = session.data.workout.name;
    let workoutDescription = `${session.data.summary.points} 🏆`;

    if (profile) {
      workoutDescription = `🥊 Average Score: ${profile?.data.summary.allTime.averagePoints}
🥇 Current Class: ${session.data.summary.points}
💥 Max Score: ${profile?.data.summary.allTime.maxPoints}
🦁 Sessions: ${profile?.data.summary.allTime.sessionCount}`;
    }

    saveTcxFile(tcxData, "workout.tcx");

    if (!DRY_RUN) {
      const uploadData = {
        name: `${session.data.studio.name} - ${workoutName}`,
        description: workoutDescription,
        data_type: "tcx",
      };

      const uploadResponse = await uploadTcxFile(
        tokenResponse.access_token,
        "workout.tcx",
        uploadData
      );

      console.info(`Upload Response: ${JSON.stringify(uploadResponse)}`);
      console.info("Workout uploaded to Strava! 🦁");
    } else {
      console.info("Workout data generated but not uploaded to Strava. 🦁");
      console.info(
        `Lionheart Data: ${JSON.stringify(session)} ${JSON.stringify(profile)}`
      );
    }
  } else {
    console.error(
      "No data fetched from Lionheart API. Please verify the details you provided and try again... 😔"
    );
  }
}

main().catch;
