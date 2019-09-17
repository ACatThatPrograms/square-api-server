require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const squareConnect = require('square-connect');

const server = express();

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.use(express.static(__dirname));

// Set Default Headers
server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-  With, Content-Type, Accept");
    next();
});

// Init Square Client
const squareClient = squareConnect.ApiClient.instance;

// Configure OAuth2 access
const oauth2 = squareClient.authentications['oauth2'];
oauth2.accessToken = process.env.API_KEY;

// Set path based on environment
squareClient.basePath = process.env.PRODUCTION === true ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com'

////////////////
// Server RUN //
////////////////

server.post('/process-payment', async (req, res) => {
  const request_params = req.body;

  // length of idempotency_key should be less than 45
  const idempotency_key = crypto.randomBytes(22).toString('hex');

  console.log(request_params.amount)

  // Charge the customer's card
  const payments_api = new squareConnect.PaymentsApi();
  const request_body = {
    source_id: request_params.nonce,
    verification_token: request_params.token,
    autocomplete: true,
    location_id: "9JFNH509QAA1B",
    amount_money: {
      amount: request_params.amount, // $1.00 charge
      currency: 'USD'
    },
    idempotency_key: idempotency_key
  };

  try {
    const response = await payments_api.createPayment(request_body);
    res.status(200).json({
      'title': 'Payment Successful',
      'result': response
    });
    console.log("PAYMENT SENT")
  } catch(error) {
    res.status(500).json({
      'title': 'Payment Failure',
      'result': error.response.text
    });
  }
});

server.listen(
  process.env.PORT,
  () => console.log(`Payment Server listening on - http://localhost:${process.env.PORT}`)
);
