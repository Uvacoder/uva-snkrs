import AWS from 'aws-sdk';

AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const client = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE_NAME = 'users';
// const SNEAKERS_TABLE_NAME = 'sneakers';

function getUsers() {
  const params: AWS.DynamoDB.DocumentClient.ScanInput = {
    TableName: USERS_TABLE_NAME,
  };

  return client.scan(params).promise();
}

interface User {
  id: string;
  email: string;
  givenName: string;
  familyName: string;
  fullName: string;
  password: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  sneakers: Array<Sneaker>;
}

interface Sneaker {
  id: string;
  brand: string;
  colorway: string;
  imagePublicId: string;
  model: string;
  purchaseDate: string;
  size: number;
  price: number;
  retailPrice: number;
  sold: boolean;
  soldDate?: string;
  soldPrice?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

async function addOrUpdateUser(user: User) {
  const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: USERS_TABLE_NAME,
    Item: user,
  };

  return client.put(params).promise();
}

async function getUserById(id: string) {
  const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
    TableName: USERS_TABLE_NAME,
    Key: { id },
  };

  return client.get(params).promise();
}

async function getUserByEmail(email: string): Promise<User | null> {
  const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
    TableName: USERS_TABLE_NAME,
    Key: { email },
  };

  const result = await client.get(params).promise();
  if (!result.Item) {
    return null;
  }

  return result.Item as User;
}

async function deleteUserById(id: string) {
  const params: AWS.DynamoDB.DocumentClient.DeleteItemInput = {
    TableName: USERS_TABLE_NAME,
    Key: { id },
  };

  return client.delete(params).promise();
}

export {
  addOrUpdateUser,
  getUsers,
  getUserByEmail,
  getUserById,
  deleteUserById,
};
