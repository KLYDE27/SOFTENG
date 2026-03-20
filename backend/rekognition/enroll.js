// rekognition/enroll.js
const { RekognitionClient, IndexFacesCommand } = require('@aws-sdk/client-rekognition');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const rekognition = new RekognitionClient({ region: process.env.AWS_REGION });
const db = new DynamoDBClient({ region: process.env.AWS_REGION });

async function enrollFamilyMember({ patientId, memberName, relationship, imageBuffer, reminiscenceImageUrl }) {
  const indexCmd = new IndexFacesCommand({
    CollectionId: `cognitive-mirror-${patientId}`,
    Image: { Bytes: imageBuffer },
    ExternalImageId: `${patientId}-${memberName}`,
    DetectionAttributes: ['DEFAULT'],
  });

  const indexRes = await rekognition.send(indexCmd);
  const faceId = indexRes.FaceRecords[0].Face.FaceId;

  const putCmd = new PutItemCommand({
    TableName: 'CognitiveMirrorFamilyMembers',
    Item: {
      faceId: { S: faceId },
      patientId: { S: patientId },
      name: { S: memberName },
      relationship: { S: relationship },
      reminiscenceImageUrl: { S: reminiscenceImageUrl },
      enrolledAt: { S: new Date().toISOString() },
    },
  });

  await db.send(putCmd);
  return { faceId, memberName };
}

module.exports = { enrollFamilyMember };
