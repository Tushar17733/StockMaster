// src/utils/database.js
import mongoose from 'mongoose';
import { config } from '../config/index.js';

// MongoDB connection
const connectDB = async () => {
  try {
    if (!config.database.uri) {
      console.error('❌ MONGO_URI is not defined in environment variables');
      console.error('📝 Please create a .env file in the server directory with:');
      console.error('   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority');
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Connection options for MongoDB Atlas
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    const conn = await mongoose.connect(config.database.uri, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    return conn;
  } catch (error) {
    console.error('\n❌ MongoDB connection failed!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (error.message?.includes('IP') || error.message?.includes('whitelist') || error.name === 'MongooseServerSelectionError') {
      console.error('🔐 IP Whitelist Issue Detected');
      console.error('');
      console.error('Your IP address is not whitelisted in MongoDB Atlas.');
      console.error('');
      console.error('📋 To fix this:');
      console.error('   1. Go to MongoDB Atlas: https://cloud.mongodb.com/');
      console.error('   2. Select your cluster');
      console.error('   3. Click "Network Access" in the left sidebar');
      console.error('   4. Click "ADD IP ADDRESS"');
      console.error('   5. Either:');
      console.error('      - Click "ADD CURRENT IP ADDRESS" (recommended for development)');
      console.error('      - OR click "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0) for development');
      console.error('   6. Wait 1-2 minutes for the change to take effect');
      console.error('   7. Try connecting again');
      console.error('');
    } else if (error.message?.includes('authentication failed')) {
      console.error('🔐 Authentication Failed');
      console.error('');
      console.error('Your MongoDB username or password is incorrect.');
      console.error('Please check your MONGO_URI connection string in the .env file.');
      console.error('');
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
      console.error('🌐 DNS Resolution Failed');
      console.error('');
      console.error('Cannot resolve MongoDB Atlas hostname. Please check:');
      console.error('   1. Your internet connection');
      console.error('   2. Your MONGO_URI connection string is correct');
      console.error('');
    } else {
      console.error('Error details:', error.message);
      if (error.reason) {
        console.error('Reason:', error.reason);
      }
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error('💡 Connection String Format:');
    console.error('   mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority');
    console.error('');
    
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;