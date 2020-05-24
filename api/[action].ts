// You must set these env vars in your Vercel:
// GH_CLIENT_ID
// GH_CLIENT_SECRET

// TODO: Add a major version system for easier changes.
// TODO: Something like this in state:
// [random string]_p[port: number]_v[version: number]


require('dotenv').config(); // dotEnv used on development mode, getting the env vars from .env file.
import { NowRequest, NowResponse } from '@now/node';
import querystring from 'querystring';
import axios from 'axios';
import uid from 'uid-promise';

// https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/
// "Note: Your OAuth App can request the scopes in the initial redirection. You can specify multiple
// scopes by separating them with a space". Ex: 'repo gist'
const scope = 'repo';


// state format is uidString_customRedirectPort.
// We store the redirect port with the state to use less Vercel computation power (to
// use indexOf instead of findIndex. It is way faster.)

// If someday this stops working, maybe wouldn't be a problem to always trust the received state.
// Don't see a security issue with this, at the current moment.

// For additional security, it could be KEY_CRYPTO,
// where the key would still be a random value, and crypto a value generated using the key and a Env secret.
// Maybe doesn't make sense, as the toGithub redirect contains the state, and the user could always use this
// state. Use a Date()?
const states: string[] = [];
const statesMaxLength = 10000; // A big number. May be changed.



function redirect(res: NowResponse, location: string, bodyObj?: any) {
  res.status(302);
  res.setHeader('Location', location + (bodyObj ? `?${querystring.stringify(bodyObj)}` : ''));
  res.send('');
}


function redirectToUser(res: NowResponse, bodyObj: any, port: number) {
  //TODO: After ~1 july, remove the '/oauthCallback'.
  // The user should already have the extension updated to allow callback to '/'.
  redirect(res, `http://localhost:${port}/oauthCallback`, bodyObj);
};



async function login(req: NowRequest, res: NowResponse) {
  let { redirectPort: redirectPortString } = req.query;

  //TODO: Remove this after ~1 july. Is just a "migration". And change above to const.
  if (!redirectPortString)
    redirectPortString = "60002";

  let redirectPort = Number(redirectPortString); // If undefined, returns NaN

  if (redirectPort < 0 || redirectPort > 65535 || !Number.isInteger(redirectPort)) // If NaN, isNotInteger.
    return errorPage(res, 'Login Error 1: Invalid or missing redirect port.');


  // To avoid the Vercel RAM exploding, if callbacks doesn't happen for a reason (aka evil users hehe)
  if (states.length >= statesMaxLength)
    states.shift();

  const state = `${await uid(20)}_${redirectPort}`;
  states.push(state);

  const query = {
    client_id: process.env.GH_CLIENT_ID,
    state,
    scope,
  } as any;

  redirect(res, `https://github.com/login/oauth/authorize`, query);
};

async function callback(req: NowRequest, res: NowResponse) {
  const { code, state } = req.query;

  if (Array.isArray(code) || Array.isArray(state) || !code || !state)
    return errorPage(res, 'Callback Error 1: Invalid query');

  // Find the state in states array
  const stateIndex = states.indexOf(state);

  if (stateIndex == -1)
    return errorPage(res, 'Callback Error 2: State not found');

  // Remove the state from states array
  states.splice(stateIndex, 1);

  try {
    const { status, data } = await axios({
      method: 'POST',
      url: `https://github.com/login/oauth/access_token`,
      responseType: 'json',
      data: {
        client_id: process.env.GH_CLIENT_ID,
        client_secret: process.env.GH_CLIENT_SECRET,
        state,
        code
      }
    });

    if (status === 200) {
      const qs = querystring.parse(data);
      if (qs.error) {
        return errorPage(res, 'Callback Error 3: ' + String(qs.error_description));
      } else {
        const port = Number(state.split('_')[1]);
        return redirectToUser(res, { token: qs.access_token }, port);
      }
    } else {
      return errorPage(res, 'Callback Error 4: GitHub server error');
    }
  }
  catch (err) {
    return errorPage(res, 'Callback Error 5: An uknown error occurred, maybe GitHub server is down right now');
  }
};



// https://micro-github.*USERNAME*.now.sh/api/login
// https://micro-github.*USERNAME*.now.sh/api/callback
// [name].ts https://vercel.com/docs/v2/serverless-functions/introduction#path-segments
module.exports = (req: NowRequest, res: NowResponse) => {
  switch (req.query.action) {
    case 'login':
      login(req, res); break;
    case 'callback':
      callback(req, res); break;
  }
};



function errorPage(res: NowResponse, errorMessage: string) {
  res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>GitHub OAuth Error</title>
  </head>

  <body>
    <p>[ ${errorMessage} ]</p>

    <style>
      * {
        padding: 0;
        margin: 0;
      }
      p {
        margin-top: 14px;
        font-size: 18px;
        font-family: sans-serif;
        text-align: center;
      }
    </style>
  </body>
</html>

`);
}
