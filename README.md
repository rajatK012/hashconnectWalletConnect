# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3030](http://localhost:3030) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### Enable HTTPS

Hashpack wallet is working based on web socket, So for wallet connection test and and performing transaction please use HTTPS for your local dev env also.

For enabling https add following variables in your `.env` file

    HTTPS=true
    SSL_CRT_FILE=path to self signed certificate
    SSL_KEY_FILE=path to sefl signed key

Cmd for creating self signed certificate for running local on ssl `openssl req -x509 -newkey rsa:2048 -keyout keytmp.pem -out cert.pem -days 365` then run `openssl rsa -in keytmp.pem -out key.pem`

set path of `cert.pem` and `key.pem` to `.env` file to run your local server on https.
