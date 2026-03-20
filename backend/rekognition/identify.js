// rekognition/identify.js
const { RekognitionClient, SearchFacesByImageCommand } = require('@aws-sdk/client-rekognition');
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');

const rekognition = new RekognitionClient({ region: process.env.AWS_REGION });
const db = new DynamoDBClient({ region: process.env.AWS_REGION });

async function identifyFace({ patientId, imageBuffer }) {
  const searchCmd = new SearchFacesByImageCommand({
    CollectionId: `cognitive-mirror-${patientId}`,
    Image: { Bytes: imageBuffer },
    MaxFaces: 1,
    FaceMatchThreshold: 90,
  });

  const res = await rekognition.send(searchCmd);
  if (res.FaceMatches.length === 0) return null;

  const matchedFace = res.FaceMatches[0];
  const getCmd = new GetItemCommand({
    TableName: 'CognitiveMirrorFamilyMembers',
    Key: { faceId: { S: matchedFace.Face.FaceId } },
  });

  const member = await db.send(getCmd);

  return {
    name: member.Item.name.S,
    relationship: member.Item.relationship.S,
    reminiscenceImageUrl: member.Item.reminiscenceImageUrl.S,
    confidence: matchedFace.Similarity,
  };
}

module.exports = { identifyFace };
