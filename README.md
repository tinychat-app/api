# api

tinychat's rest api

## Installation

### Redis / KeyDB

A redis or keydb server needs to be running for `rest` to communicate with the `gateway`.

To run one with docker use `docker run --name some-keydb -p 6379:6379 -d eqalpha/keydb`

### MongoDB

A mongodb instance should be running for `rest` to store data. 

To run one with docker use `docker run --name some-mongodb -p 27017:27017 -d mongo`

### Gateway 

As tinychat uses redis/keydb as a push and forget message broker, it is not necessary to run the [gateway](https://github.com/tinychat-app/gateway).


### api

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