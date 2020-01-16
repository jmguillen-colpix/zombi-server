"use strict";

const config = require("./config");

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

(async () => {

    try {

        if(config.aws.use_console) { AWS.config.logger = console; }

        AWS.config.update({region: config.aws.region});

        AWS.config.apiVersions = config.aws.api_versions;

        console.log("Access key:", AWS.config.credentials.accessKeyId);
        console.log("Region:", AWS.config.region);


        var instance_settings = {
            ImageId: config.aws.image_id,
            InstanceType: config.aws.instance_type,
            KeyName: config.aws.key_pair,
            MaxCount: 1,
            MinCount: 1,
            SecurityGroupIds: config.aws.security_groups,
            SubnetId: config.aws.subnet_id,
            TagSpecifications: [
                {
                    ResourceType: "instance",
                    Tags: [
                        {
                            Key: "Name",
                            Value: config.aws.instance_name
                        }
                    ]
                }
            ]
        };

        // TODO check if exists with the same name before creating a new instance
        var instance_creation_data = await new AWS.EC2().runInstances(instance_settings).promise();

        var instance_id = instance_creation_data.Instances[0].InstanceId;

        console.log("Created instance: ", instance_id);

        const instance_public_dns_name = await instance_check_state(instance_id);

        console.log(`Ìnstance public DNS name: ${instance_public_dns_name}`);

        fs.writeFileSync(`${__dirname}/server.name`, instance_public_dns_name);

        console.log("Instance creation done");

    } catch (error) { console.log(error); }

})();







