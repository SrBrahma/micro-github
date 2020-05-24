# Change Log
All notable changes to this project will be documented in this file.

# SrBrahma fork

## [2.0.0] - May 24, 2020

Removed allow_signup option. Now always true.

Now always redirects to localhost.

Client must provide the redirectPort.

Displays an error page on error, only redirects to user on success (as with a invalid redirectPort query param, it wouldn't have an port to send the error code).


## [?.?.?] - May 4, 2020

Hardcoded the scope parameter, so malicious applications that have access to the user machine can't mistake him under your application name to get further authorizations.

Added max states length, so malicious people can't explode Vercel RAM with invalid requests.


## [?.?.?] - April 30, 2020

Moved to typescript with the necessary changes.

Minor general changes.


# Parent Repository original Change Log

## [1.1.0] - 2019-08-07
### Added
- Refactor to support Zeit Now's 2.0 routing system.

## [1.0.0] - 2017-04-01
### Added
- Support for state parameter to protect against cross-site request forgery attacks. Requires users to use the provided `/login` url and moves redirect url from `/` to `/callback`
