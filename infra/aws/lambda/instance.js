"use strict";

const config = require("../config");
const ssh = require("../ssh");

const AWS = require("aws-sdk");
const fs = require('fs');

const sleep = ms => { return new Promise(resolve => setTimeout(resolve, ms)); };

const instance_check_state = async instance_id => {

    const instance_data = await new AWS.EC2().describeInstances({ InstanceIds: [instance_id] }).promise();

    const instance_state = instance_data.Reservations[0].Instances[0].State.Name;

    if (instance_state !== "running") {

        console.log(`Instance is in state ${instance_state}, waiting...`);

        await sleep(5000);

        await instance_check_state(instance_id);

    } else { console.log(`Instance is in state ${instance_state}, server creation done.`); }

    return instance_data.Reservations[0].Instances[0].PublicDnsName;

};

const instance_check_network = async (instance_public_dns_name, attempts = 0) => {

    if (attempts >= 10) {
        console.log(`Cannot connect after ${attempts} attempts, quitting.`);
        return false;
    }

    const resp = await ssh.ping({
        host: instance_public_dns_name,
        username: config.aws.ssh.username,
        privateKey: config.aws.ssh.key_file
    });

    if (!resp) {

        console.log(`Instance network still down, waiting...`);

        await sleep(10000);

        await instance_check_network(instance_public_dns_name, attempts + 1);

    } else { console.log(`Instance network running, SSH can connect now.`); }

    return true;

};

(async () => {

    try {

        if (!fs.existsSync(config.aws.ssh.key_file)) {
            console.log(`SSH key file "${config.aws.ssh.key_file}" not found, please check configuration.`);

            return false;
        }

        if (config.aws.use_console) { AWS.config.logger = console; }

        AWS.config.update({ region: config.aws.region });

        AWS.config.apiVersions = config.aws.api_versions;

        console.log("Access key:", AWS.config.credentials.accessKeyId);
        console.log("Region:", AWS.config.region);

        const s3 = new AWS.S3();

        console.log(config.aws.lambda.bucket_name);

        var bucketParams = {
            Bucket: config.aws.lambda.bucket_name,
            ACL: 'public-read'
        };

        try {

            const s3_data = await s3.createBucket(bucketParams).promise();

            console.log("Bucket URL: ", s3_data.Location);

        } catch (error) {

            if (error.code = 'BucketAlreadyOwnedByYou') {

                console.log("Bucket was already ceated");

            } else { throw error; }
        }

        // Read content from the file
        const fileContent = fs.readFileSync(config.aws.ssh.key_file);

        // Setting up S3 upload parameters
        const params = {
            Bucket: config.aws.lambda.bucket_name,
            Key: 'key.pem', // File name you want to save as in S3
            Body: fileContent
        };

        // Uploading files to the bucket
        const upload_data = await s3.upload(params).promise();

        console.log(`File uploaded successfully. ${upload_data.Location}`);

        console.log(JSON.stringify(upload_data));


        // // Create the IAM service object
        // const iam = new AWS.IAM();

        // const myPolicy = {
        //     "Version": "2012-10-17",
        //     "Statement": [
        //         {
        //             "Effect": "Allow",
        //             "Principal": {
        //                 "Service": "lambda.amazonaws.com"
        //             },
        //             "Action": "sts:AssumeRole"
        //         }
        //     ]
        // };

        // const createParams = {
        //     AssumeRolePolicyDocument: JSON.stringify(myPolicy),
        //     RoleName: "ROLE"
        // };

        // var policyParams = {
        //     PolicyArn: "arn:aws:iam::policy/service-role/AWSLambdaRole",
        //     RoleName: "ROLE"
        // };

        // const role_data = await iam.createRole(createParams).promise();

        // console.log("Role ARN:", role_data.Role.Arn);

        // const policy_data = await iam.attachRolePolicy(policyParams).promise();

        // console.log(JSON.stringify(policy_data));

        // console.log("AWSLambdaRole Policy attached");





        console.log("Instance creation done");

    } catch (error) { console.log(error); }

})();











