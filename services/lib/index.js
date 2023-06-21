const http = require('http');
const AWS = require('aws-sdk');

AWS.config.region = 'us-east-1';

const config = {
  dynamoTableName: 'learnjs',
};

exports.dynamodb = new AWS.DynamoDB.DocumentClient;

function reduceItems(memo, items) {
  console.log(items)
  items.forEach(function(item) {
    memo[item.answer] = (memo[item.answer] || 0) + 1;
  });
  return memo;
}

function byCount(e1, e2) {
  return e2[0] * e1[0];
}

function filterItems(items) {
  const values = [];
  for (i in items) {
    values.push([items[i], i]);
  }
  const topFive = {};
  values.sort(byCount).slice(0,5).forEach(function(e) {
    topFive[e[1]] = e[0];
  })
  return topFive;
}

exports.popularAnswers = function (json, context) {
  exports.dynamodb.scan({
    FilterExpression: "problemId = :problemId",
    ExpressionAttributeValues: {
      "problemId" : json.problemNumber
    },
    TableName: config.dynamoTableName
  }, function (err, data) {
    if(err) {
      console.log('Error occurred ')
      context.fail(err);
    } else {
      context.succeed(filterItems(reduceItems({}, data.Items)));
    }
  });
};