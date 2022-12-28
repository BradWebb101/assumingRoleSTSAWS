// Import sts client
import { STSClient } from  "@aws-sdk/client-sts";

//Import sts client
import {
  AssumeRoleCommand,
  GetCallerIdentityCommand,
} from "@aws-sdk/client-sts";

//Import s3 client 
import {  S3Client, ListObjectsCommand } from "@aws-sdk/client-s3"; 
  
//Set AWS region (ADD MORE DETAILS AS TO REASON, STS SHOULD BE CENTRALISED IN us-east-1 COULD JUST BE FOR s3)
const REGION = "ap-southeast-2"; //e.g. "us-east-1" or "ap-southeast-1"

// Create an Amazon STS service client object.
const stsClient = new STSClient({ region: REGION });

// Set the parameters
const params = {
  //Role to assume
  RoleArn: "ADD_IN_ROLE_WITH_REQUIRED_PERMISSIONS", 
  //Role session name, add business process/identifier here
  RoleSessionName: "ADD_IN_ROLE_SESSION",
  //Duration for the credentials. 
  DurationSeconds: 900,
  //This is an optional 'Security' measure to reduce change of miss using role. 
  ExternalId: 'ADD_IN_EXTERNAL_ID'
};

export const handler = async () => {
  try {
    //Process to get temporary credentials for assumed role
    //Assume Role from above credentials
    //https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/assumerolecommandinput.html
    const data = await stsClient.send(new AssumeRoleCommand(params));

    //Returned temporary credentials for session
    const rolecreds = {
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken
    };
    
    //Process to list bucket objects. Add in s3 upload or download process here.
    //Get Amazon Resource Name (ARN) of current identity
    try {
      
      //Setting region
      const stsParams = { credentials: rolecreds, region: REGION };
      
      //Creating s3 Client using temporary credentials for assumed role
      const s3 = new S3Client(stsParams)
      
      //Dictionary of bucket name, can add bucket credentials there. See docs
      //https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/listobjectscommandinput.html
      const bucketParams = {
        Bucket: 'ADD_IN_BUCKET_YOU_WANT_TO_LIST'
      }
      //Sending request to s3. List objectscommand
      //Other actions on s3 get,put,delete https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/index.html
      const results = await s3.send(new ListObjectsCommand(bucketParams))
      
      //Returning results of list bucket using sts assume role 
      console.log(`The bucket ${bucketParams.Bucket} has the following items ${results['Contents'][0]['Key']}. The role who made the call ${params.RoleArn}, the role that has permissions to access the items was  ${data.AssumedRoleUser.Arn} which assumed ${data.AssumedRoleUser.AssumedRoleId}`)
      
    } catch (err) {
      console.log(err, err.stack);
    }
  } catch (err) {
    console.log("Error", err);
  }
};
