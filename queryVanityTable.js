const AWS = require('aws-sdk');

const region = 'us-east-1';
const {queryItemLimit, dbTable, indexName} = process.env;
const dynamoDbClient = createDynamoDbClient(region);
let queryInput = createQueryInput(queryItemLimit);

function createDynamoDbClient(regionName) {
  AWS.config.update({region: regionName});
  return new AWS.DynamoDB();
}

function createQueryInput(queryItemLimit) {
  return {
    "TableName": dbTable,
    "IndexName": indexName,
    "ScanIndexForward": false,
    "ConsistentRead": false,
    "KeyConditionExpression": "#69240 = :69240",
    "ExpressionAttributeValues": {
      ":69240": {
        "S": "vanitynumber"
      }
    },
    "ExpressionAttributeNames": {
      "#69240": "attr3"
    },
    "Limit": queryItemLimit,
  }
}
exports.handler = async(event) => {
  let response;
  try {
    let queryOutput = await dynamoDbClient.query(queryInput).promise();
    let responseBody = formatResponseBody((queryOutput.Items)); 
    console.log(responseBody);
    response = {
      "body": JSON.stringify(responseBody),
      "statusCode": 200,
      "isBase64Encoded": false,
      "headers": {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      }
    };
    return response;
  } catch(err) {
    handleQueryError(err);
    response = {
      "body": "query error",
      "statusCode": 400,
      "isBase64Encoded": false,
      "headers": {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      }
    };
    return response;
  }
};

function formatResponseBody (queryOutput) {
  let uniqueKeys = [];
  let lastPhoneNumbers = [];
  for (let item of queryOutput) {
    if (!uniqueKeys.includes(item.sk.S)) {
      uniqueKeys.push(item.sk.S);
    }
  }
  for (let timedate of uniqueKeys) {
    let phoneAndWords = {vanityWords: []};
    phoneAndWords["timedate"] = timedate;
    for (let item of queryOutput) {
      if (item.sk.S === timedate) {
        phoneAndWords["phoneNumber"] = item.attr1.S;
        phoneAndWords.vanityWords.push(item.pk.S);
      }
    }
    lastPhoneNumbers.push(phoneAndWords);
  }
  // console.log("list " + lastPhoneNumbers);
  return lastPhoneNumbers.slice(0, 5);
}

function handleQueryError(err) {
  if (!err) {
    console.error('Encountered error object was empty');
    return;
  }
  if (!err.code) {
    console.error(`An exception occurred, investigate and configure retry strategy. Error: ${JSON.stringify(err)}`);
    return;
  }
  // here are no API specific errors to handle for Query, common DynamoDB API errors are handled below
  handleCommonErrors(err);
}

function handleCommonErrors(err) {
  switch (err.code) {
    case 'InternalServerError':
      console.error(`Internal Server Error, generally safe to retry with exponential back-off. Error: ${err.message}`);
      return;
    case 'ProvisionedThroughputExceededException':
      console.error(`Request rate is too high. If you're using a custom retry strategy make sure to retry with exponential back-off. `
        + `Otherwise consider reducing frequency of requests or increasing provisioned capacity for your table or secondary index. Error: ${err.message}`);
      return;
    case 'ResourceNotFoundException':
      console.error(`One of the tables was not found, verify table exists before retrying. Error: ${err.message}`);
      return;
    case 'ServiceUnavailable':
      console.error(`Had trouble reaching DynamoDB. generally safe to retry with exponential back-off. Error: ${err.message}`);
      return;
    case 'ThrottlingException':
      console.error(`Request denied due to throttling, generally safe to retry with exponential back-off. Error: ${err.message}`);
      return;
    case 'UnrecognizedClientException':
      console.error(`The request signature is incorrect most likely due to an invalid AWS access key ID or secret key, fix before retrying. `
        + `Error: ${err.message}`);
      return;
    case 'ValidationException':
      console.error(`The input fails to satisfy the constraints specified by DynamoDB, `
        + `fix input before retrying. Error: ${err.message}`);
      return;
    case 'RequestLimitExceeded':
      console.error(`Throughput exceeds the current throughput limit for your account, `
        + `increase account level throughput before retrying. Error: ${err.message}`);
      return;
    default:
      console.error(`An exception occurred, investigate and configure retry strategy. Error: ${err.message}`);
      return;
  }
}
