// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const cardValidator = require('simple-card-validator');
const uuid = require('uuid/v4');
const pino = require('pino');

const logger = pino({
  name: 'paymentservice-charge',
  messageKey: 'message',
  changeLevelName: 'severity',
  useLevelLabels: true
});


class CreditCardError extends Error {
  constructor (message) {
    super(message);
    this.code = 400; // Invalid argument error
  }
}

class InvalidCreditCard extends CreditCardError {
  constructor (cardType) {
    super(`Credit card info is invalid`);
  }
}

class UnacceptedCreditCard extends CreditCardError {
  constructor (cardType) {
    super(`Sorry, we cannot process ${cardType} credit cards. Only VISA or MasterCard is accepted.`);
  }
}

class ExpiredCreditCard extends CreditCardError {
  constructor (number, month, year) {
    super(`Your credit card (ending ${number.substr(-4)}) expired on ${month}/${year}`);
  }
}

/**
 * Verifies the credit card number and (pretend) charges the card.
 *
 * @param {*} request
 * @return transaction_id - a random uuid v4.
 */
module.exports = function charge (request) {
  const { amount, credit_card: creditCard } = request;
  const cardNumber = creditCard.credit_card_number;
  const cardInfo = cardValidator(cardNumber);
  var {
    card_type: cardType,
    valid
  } = cardInfo.getCardDetails();

  if (!valid) { throw new InvalidCreditCard(); }

  //08.04.2022 Stefan Penner: Added possibility to increase error rate percentage by environment variable simulating Not Supported Card Issuer
  if(process.env.WRONG_CARD_TYPE_FAILURE_RATE > 0) {
    console.log("Random wrong card error enabled with failure rate " + process.env.WRONG_CARD_TYPE_FAILURE_RATE + "%.")
    // Generate random number between 1 and 10
    const rand =  Math.floor(Math.random() * 100) + 1;
    if (rand <= process.env.WRONG_CARD_TYPE_FAILURE_RATE) {
      cardType = 'AMEX';
    }
  } else {
    console.log("Random wrong card error disabled.")
  }

  // Only VISA and mastercard is accepted, other card types (AMEX, dinersclub) will
  // throw UnacceptedCreditCard error.
  if (!(cardType === 'visa' || cardType === 'mastercard')) { throw new UnacceptedCreditCard(cardType); }

  // Also validate expiration is > today.
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { credit_card_expiration_year: year, credit_card_expiration_month: month } = creditCard;
  if ((currentYear * 12 + currentMonth) > (year * 12 + month)) { throw new ExpiredCreditCard(cardNumber.replace('-', ''), month, year); }

  logger.info(`Transaction processed: ${cardType} ending ${cardNumber.substr(-4)} \
    Amount: ${amount.currency_code}${amount.units}.${amount.nanos}`);

  return { transaction_id: uuid() };
};
