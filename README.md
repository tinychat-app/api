# api

tinychat's rest api

## Installation

A redis or keydb server needs to be running for `rest` to communicate with the `gateway`.

To run one with docker use `docker run --name some-keydb -p 6379:6379 -d eqalpha/keydb`

Additionally the [gateway](https://github.com/tinychat-app/gateway) needs to be running.

First install the dependencies:

```bash
yarn install
```

Then start the server

```bash
yarn dev
```

By default the server will run on port 3000

## Usage

Check `/docs` for the api documentation