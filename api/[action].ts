import { NowRequest, NowResponse } from '@now/node';
import querystring from 'querystring';
import axios from 'axios';
import uid from 'uid-promise';

// You must set these env vars in your Vercel:
// GH_CLIENT_ID
// GH_CLIENT_SECRET
// USER_REDIRECT_URL

const githubUrl = process.env.GH_HOST || 'github.com';
const userRedirect = process.env.USER_REDIRECT_URL || 'https://www.google.com';


function redirect(res: NowResponse, location: string, body: any) {
  res.setHeader('Location', location);
  res.send(body);
}

// If needed, the states array could also have a port or a full redirect uri,
// allowing users to set custom ports to localhost, for example;
const states: string[] = [];
const statesMaxLength = 10000; // A big number.

function redirectToUser(res: NowResponse, body: any) {
  redirect(res, userRedirect, body);
};

async function login(req: NowRequest, res: NowResponse) {
  const state = await uid(30);

  // Just a safety measure to avoid the Vercel RAM exploding, if callbacks doesn't happen for some reason.
  if (states.length >= statesMaxLength)
    states.shift();

  states.push(state);
  const { scope, allow_signup } = req.query;
  const query = {
    client_id: process.env.GH_CLIENT_ID,
    state: state
  } as any;
  if (scope)
    query.scope = scope;
  if (allow_signup !== undefined)
    query.allow_signup = allow_signup;

  redirect(res, `https://${githubUrl}/login/oauth/authorize`, query);
};

async function callback(req: NowRequest, res: NowResponse) {
  // res.setHeader('Content-Type', 'text/html');
  const { code, state } = req.query as any;

  if (!code && !state) {
    redirectToUser(res, { error: 'Provide code and state query param' });
  } else if (!states.includes(state)) {
    redirectToUser(res, { error: 'Unknown state' });
  } else {
    states.splice(states.indexOf(state), 1);
    try {
      const { status, data } = await axios({
        method: 'POST',
        url: `https://${githubUrl}/login/oauth/access_token`,
        responseType: 'json',
        data: {
          client_id: process.env.GH_CLIENT_ID,
          client_secret: process.env.GH_CLIENT_SECRET,
          code
        }
      });

      if (status === 200) {
        const qs = querystring.parse(data);
        if (qs.error) {
          redirectToUser(res, { error: qs.error_description });
        } else {
          redirectToUser(res, { token: qs.access_token });
        }
      } else {
        redirectToUser(res, { error: 'GitHub server error.' });
      }
    } catch (err) {
      redirectToUser(res, { error: 'Please provide GH_CLIENT_ID and GH_CLIENT_SECRET as environment variables. (or GitHub might be down)' });
    }
  }
};

// api/[action].js
// https://micro-github.*USERNAME*.now.sh/api/login
// https://micro-github.*USERNAME*.now.sh/api/callback
module.exports = (req: NowRequest, res: NowResponse) => {
  if (req.query.action === "login") {
    login(req, res);
  } else if (req.query.action === "callback") {
    callback(req, res);
  }
};
