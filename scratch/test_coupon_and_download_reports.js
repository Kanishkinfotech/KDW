const http = require('http');
const path = require('path');
const jwt = require(path.join(__dirname, '../server/node_modules/jsonwebtoken'));
const { PrismaClient } = require(path.join(__dirname, '../server/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this-in-production';

