"use strict";

const server = require("./server");
const log = require("./log");
const stats = require("./stats");

/*

Input Format of a Lambda Function for Proxy Integration
In Lambda proxy integration, API Gateway maps the entire client request to the input event parameter of the backend Lambda function as follows:

{
    "resource": "Resource path",
    "path": "Path parameter",
    "httpMethod": "Incoming request's method name"
    "headers": {String containing incoming request headers}
    "multiValueHeaders": {List of strings containing incoming request headers}
    "queryStringParameters": {query string parameters }
    "multiValueQueryStringParameters": {List of query string parameters}
    "pathParameters":  {path parameters}
    "stageVariables": {Applicable stage variables}
    "requestContext": {Request context, including authorizer-returned key-value pairs}
    "body": "A JSON string of the request payload."
    "isBase64Encoded": "A boolean flag to indicate if the applicable request payload is Base64-encode"
}

-----BEGIN CERTIFICATE-----
MIIC6TCCAdGgAwIBAgIJALqBuWcPRQVRMA0GCSqGSIb3DQEBCwUAMDQxCzAJBgNV
BAYTAlVTMRAwDgYDVQQHEwdTZWF0dGxlMRMwEQYDVQQDEwpBcGlHYXRld2F5MB4X
DTIwMDEyMzAxNTAwMVoXDTIxMDEyMjAxNTAwMVowNDELMAkGA1UEBhMCVVMxEDAO
BgNVBAcTB1NlYXR0bGUxEzARBgNVBAMTCkFwaUdhdGV3YXkwggEiMA0GCSqGSIb3
DQEBAQUAA4IBDwAwggEKAoIBAQCKdHMVz20xFB3yxhEDcWEMBD+uelDTJ+8b7rEG
jbMRh0s+1n4jL4Zjy8+3kYQK3wh9hyLs7AaoXwr8he/iNZHkM074lEbW/ZKNafLp
VEDyyHcrZlWRjW+RihX85YXSMgiHKG1DVxAN4G3RcgKTuz5DZe6s7C4zYXeFUb1/
yrNhDfTV76t/FdNif8A09+WLZ6Fzz3XMbsU8UGJODvCL9OTPD2UL8zvNi9zZ98xx
71C3V+eTe7sihMWTOf2SMhiY5ih5zdYz+N/iVN3AW0tD7xgnIXB8sQAcLmolvRtL
xPdgOl9E+aiW/dU4a6LW6DGiETP+Lb4cBf1o8uHuwF8qFy9HAgMBAAEwDQYJKoZI
hvcNAQELBQADggEBABu85zN6yEXnWwZwOtrGh3kLQT3jXcy2VSCen2Zpn9mxs+/q
4MMZ93QUsYazEWRpFH6yUMbxRENtiIch7VvkvLD87w9jT6F5EQx6NMTdRZxdBB0U
6x66QvRg/6hieyr455poOhSj9AU54xuJml1vIX/f8GmyZs6e/d50U8/X4mb31voi
OYRGfPUfNmNvo+yq6jxMFRXOWVfiLZBBF+g/ztxLdAEOxeyRW0t56Ub+QBXj3tF7
N7qcFpn+0schDJdHOIw262M+Xc3Pc5AFwWCrCpNIQAFAN3bYvWE2eYhXTOSD1WUf
12QjIDAvrF66fbDKIm/NfAV15KJMrx2PgaZpd94=
-----END CERTIFICATE-----

*/

exports.server = (event, context) => {


    return {
        "isBase64Encoded": false,
        "statusCode": 200,
        "body": "Here I am"
    };

    // try {

    //     log.debug(JSON.stringify(event));
    //     log.debug(JSON.stringify(context));

    //     stats.oup();

    //     const params = JSON.parse(event);

    //     const { mod, fun, args, token } = params;
    //     var sequence = params.sequence;

    //     // This is to get IP Address from HAProxy directed requests
    //     const ip = headers["x-forwarded-for"] || res.socket.remoteAddress;
    //     const ua = headers["user-agent"];

    //     callback(JSON.stringify(await server.execute(mod, fun, args, token, sequence, ip, ua)));

    // } catch (error) {
    //     stats.eup();

    //     callback(JSON.stringify(server.response({ error: true, message: error.message, sequence })));
    // }

    /*
    Output Format of a Lambda Function for Proxy Integration

    {
    "isBase64Encoded": true|false,
    "statusCode": httpStatusCode,
    "headers": { "headerName": "headerValue", ... },
    "multiValueHeaders": { "headerName": ["headerValue", "headerValue2", ...], ... },
    "body": "..."
}
    
    */


};

/* 

Async Functions
For async functions, you can use return and throw to send a response or error, respectively.

const https = require('https')
let url = "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html"

exports.handler = async function(event) {
  const promise = new Promise(function(resolve, reject) {
    https.get(url, (res) => {
        resolve(res.statusCode)
      }).on('error', (e) => {
        reject(Error(e))
      })
    })
  return promise
}

Non-Async Functions
The following example function checks a URL and returns the status code to the invoker.

Example index.js File – HTTP Request with Callback

const https = require('https')
let url = "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html"

exports.handler =  function(event, context, callback) {
  https.get(url, (res) => {
    callback(null, res.statusCode)
  }).on('error', (e) => {
    callback(Error(e))
  })
}


When Lambda runs your function, it passes a context object to the handler. This object provides methods and properties that provide information about the invocation, function, and execution environment.

Context Methods

getRemainingTimeInMillis() – Returns the number of milliseconds left before the execution times out.

Context Properties

functionName – The name of the Lambda function.

functionVersion – The version of the function.

invokedFunctionArn – The Amazon Resource Name (ARN) that's used to invoke the function. Indicates if the invoker specified a version number or alias.

memoryLimitInMB – The amount of memory that's allocated for the function.

awsRequestId – The identifier of the invocation request.

logGroupName – The log group for the function.

logStreamName – The log stream for the function instance.

identity – (mobile apps) Information about the Amazon Cognito identity that authorized the request.

cognitoIdentityId – The authenticated Amazon Cognito identity.

cognitoIdentityPoolId – The Amazon Cognito identity pool that authorized the invocation.

clientContext – (mobile apps) Client context that's provided to Lambda by the client application.

client.installation_id

client.app_title

client.app_version_name

client.app_version_code

client.app_package_name

env.platform_version

env.platform

env.make

env.model

env.locale

Custom – Custom values that are set by the mobile application.

callbackWaitsForEmptyEventLoop – Set to false to send the response right away when the callback executes, instead of waiting for the Node.js event loop to be empty. If this is false, any outstanding events continue to run during the next invocation.



AWS Lambda Function Logging in Node.js

Your Lambda function comes with a CloudWatch Logs log group, with a log stream for each instance of your function. The runtime sends details about each invocation to the log stream, and relays logs and other output from your function's code.

To output logs from your function code, you can use methods on the console object, or any logging library that writes to stdout or stderr.




AWS Lambda Function Errors in Node.js

When your code raises an error, Lambda generates a JSON representation of the error. This error document appears in the invocation log and, for synchronous invocations, in the output.




{
  "message": "Hello me!",
  "input": {
    "resource": "/{proxy+}",
    "path": "/hello/world",
    "httpMethod": "POST",
    "headers": {
      "Accept": "* /*",
      "Accept-Encoding": "gzip, deflate",
      "cache-control": "no-cache",
      "CloudFront-Forwarded-Proto": "https",
      "CloudFront-Is-Desktop-Viewer": "true",
      "CloudFront-Is-Mobile-Viewer": "false",
      "CloudFront-Is-SmartTV-Viewer": "false",
      "CloudFront-Is-Tablet-Viewer": "false",
      "CloudFront-Viewer-Country": "US",
      "Content-Type": "application/json",
      "headerName": "headerValue",
      "Host": "gy415nuibc.execute-api.us-east-1.amazonaws.com",
      "Postman-Token": "9f583ef0-ed83-4a38-aef3-eb9ce3f7a57f",
      "User-Agent": "PostmanRuntime/2.4.5",
      "Via": "1.1 d98420743a69852491bbdea73f7680bd.cloudfront.net (CloudFront)",
      "X-Amz-Cf-Id": "pn-PWIJc6thYnZm5P0NMgOUglL1DYtl0gdeJky8tqsg8iS_sgsKD1A==",
      "X-Forwarded-For": "54.240.196.186, 54.182.214.83",
      "X-Forwarded-Port": "443",
      "X-Forwarded-Proto": "https"
    },
    "multiValueHeaders":{
      'Accept':[
        "* /*"
      ],
      'Accept-Encoding':[
        "gzip, deflate"
      ],
      'cache-control':[
        "no-cache"
      ],
      'CloudFront-Forwarded-Proto':[
        "https"
      ],
      'CloudFront-Is-Desktop-Viewer':[
        "true"
      ],
      'CloudFront-Is-Mobile-Viewer':[
        "false"
      ],
      'CloudFront-Is-SmartTV-Viewer':[
        "false"
      ],
      'CloudFront-Is-Tablet-Viewer':[
        "false"
      ],
      'CloudFront-Viewer-Country':[
        "US"
      ],
      '':[
        ""
      ],
      'Content-Type':[
        "application/json"
      ],
      'headerName':[
        "headerValue"
      ],
      'Host':[
        "gy415nuibc.execute-api.us-east-1.amazonaws.com"
      ],
      'Postman-Token':[
        "9f583ef0-ed83-4a38-aef3-eb9ce3f7a57f"
      ],
      'User-Agent':[
        "PostmanRuntime/2.4.5"
      ],
      'Via':[
        "1.1 d98420743a69852491bbdea73f7680bd.cloudfront.net (CloudFront)"
      ],
      'X-Amz-Cf-Id':[
        "pn-PWIJc6thYnZm5P0NMgOUglL1DYtl0gdeJky8tqsg8iS_sgsKD1A=="
      ],
      'X-Forwarded-For':[
        "54.240.196.186, 54.182.214.83"
      ],
      'X-Forwarded-Port':[
        "443"
      ],
      'X-Forwarded-Proto':[
        "https"
      ]
    },
    "queryStringParameters": {
      "name": "me",
      "multivalueName": "me"
    },
    "multiValueQueryStringParameters":{
      "name":[
        "me"
      ],
      "multivalueName":[
        "you",
        "me"
      ]
    },
    "pathParameters": {
      "proxy": "hello/world"
    },
    "stageVariables": {
      "stageVariableName": "stageVariableValue"
    },
    "requestContext": {
      "accountId": "12345678912",
      "resourceId": "roq9wj",
      "stage": "testStage",
      "requestId": "deef4878-7910-11e6-8f14-25afc3e9ae33",
      "identity": {
        "cognitoIdentityPoolId": null,
        "accountId": null,
        "cognitoIdentityId": null,
        "caller": null,
        "apiKey": null,
        "sourceIp": "192.168.196.186",
        "cognitoAuthenticationType": null,
        "cognitoAuthenticationProvider": null,
        "userArn": null,
        "userAgent": "PostmanRuntime/2.4.5",
        "user": null
      },
      "resourcePath": "/{proxy+}",
      "httpMethod": "POST",
      "apiId": "gy415nuibc"
    },
    "body": "{\r\n\t\"a\": 1\r\n}",
    "isBase64Encoded": false
  }
}
*/