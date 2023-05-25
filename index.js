import dotenv from "dotenv";
dotenv.config();

import {
  AppConfigDataClient,
  BadRequestException,
  GetLatestConfigurationCommand,
  StartConfigurationSessionCommand,
} from "@aws-sdk/client-appconfigdata";

const client = new AppConfigDataClient({});
let existingToken;

const getToken = async () => {
  const getSession = new StartConfigurationSessionCommand({
    ApplicationIdentifier: process.env.APP_CONFIG_APP_IDENTIFIER,
    ConfigurationProfileIdentifier:
      process.env.APP_CONFIG_CONFIG_PROFILE_IDENTIFIER,
    EnvironmentIdentifier: process.env.APP_CONFIG_ENVIRONMENT_IDENTIFIER,
  });
  const sessionToken = await client.send(getSession);
  return sessionToken.InitialConfigurationToken || "";
};

const featureFlag = async (flag) => {
  if (!existingToken) {
    existingToken = await getToken();
    console.log(existingToken);
  }
  try {
    const command = new GetLatestConfigurationCommand({
      ConfigurationToken: existingToken,
    });
    const response = await client.send(command);
    let flags = {};
    if (response.Configuration) {
      let str = "";
      for (let i = 0; i < response.Configuration.length; i++) {
        str += String.fromCharCode(response.Configuration[i]);
      }
      const allFlag = JSON.parse(str);
      console.log(allFlag);
      flags = Object.assign({}, allFlag);
    }
    return Boolean(flags[flag]?.enabled);
  } catch (err) {
    if (err instanceof BadRequestException) {
      existingToken = await getToken();
      console.log(existingToken);
      // recall
      return featureFlag(flag);
    } else {
      throw err;
    }
  }
};

featureFlag("contract_p2").then((result) => {
  console.log(result);
});

export default featureFlag;
