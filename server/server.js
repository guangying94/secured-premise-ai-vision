// server.js

const express = require('express');
const cors = require('cors');
const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();

const bodyParser = require('body-parser');//Parse JSON requests
const path = require('path');             //Navigate to build folder

app.use(express.static(path.join(__dirname, 'build')));

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname, 'build/index.html'));
   });

app.get('/status', (req, res) => {
    res.json({ status: 'OK' });
});

app.post('/api/compare', (req, res) => {
    // get the image from the request body, with key 'url'
    const inImageUrl = req.body.inUrl;
    const outImageUrl = req.body.outUrl;
    const userPrompt = req.body.userPrompt;

    const gpt4vEndpoint = process.env.GPT4V_ENDPOINT;
    const gpt4vKey = process.env.GPT4V_KEY;

    // define the request headers
    const headers = {
        'Content-Type': 'application/json',
        'api-key': gpt4vKey
    }

    // define the request body
    const payload = {
        "messages":[
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": "You are an AI assistant that understand visual content. You are asked to provide a response to the user's query based on the image provided."
                    
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": inImageUrl
                        }
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": outImageUrl
                        }
                    },
                    {
                        "type": "text",
                        "text": userPrompt
                    }
                ]
            }
        ],
        "temperature": 0.7,
        "max_tokens": 800,
        "top_p": 0.95,
    }

    // make a POST request to the GPT-4 Visual endpoint
    fetch(gpt4vEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    }) 
        .then(response => response.text())
      /*  .then(data => console.log(data)) */
         .then(data => {
            // clean the data by replacing ```json with empty string
            data = data.replace('```json', '');
            data = data.replace('```', '');
            // clean the data by replacing \n with empty string
            data = data.replace(/\n/g, '');
            // parse the data to JSON
            data_json = JSON.parse(data);
            // get the response from the AI
            const aiResponse = JSON.parse(data_json.choices[0].message.content);
            console.log(aiResponse);
            // send the response back to the client
            res.json({ "aiResponse" : aiResponse });
        }) 
        .catch(error => {
            console.error('Error:', error);
            //res.status(500).json({ error: 'An error occurred' });
            res.status(500).json({ 'item': 'please retry', 'quantity': 0});
        });
});



app.post('/api/scan', (req, res) => {
    // get the image from the request body, with key 'url'
    const imageUrl = req.body.url;
    const userPrompt = req.body.userPrompt;

    const gpt4vEndpoint = process.env.GPT4V_ENDPOINT;
    const gpt4vKey = process.env.GPT4V_KEY;

    // define the request headers
    const headers = {
        'Content-Type': 'application/json',
        'api-key': gpt4vKey
    }

    // define the request body
    const payload = {
        "messages":[
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": "You are an AI assistant that understand visual content. You are asked to provide a response to the user's query based on the image provided."
                    
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": imageUrl
                        }
                    },
                    {
                        "type": "text",
                        "text": userPrompt
                    }
                ]
            }
        ],
        "temperature": 0.7,
        "max_tokens": 800,
        "top_p": 0.95,
    }

    // make a POST request to the GPT-4 Visual endpoint
    fetch(gpt4vEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    }) 
        .then(response => response.text())
      /*  .then(data => console.log(data)) */
         .then(data => {
            // clean the data by replacing ```json with empty string
            data = data.replace('```json', '');
            data = data.replace('```', '');
            // clean the data by replacing \n with empty string
            data = data.replace(/\n/g, '');
            // parse the data to JSON
            data_json = JSON.parse(data);
            // get the response from the AI
            const aiResponse = JSON.parse(data_json.choices[0].message.content);
            console.log(aiResponse);
            // send the response back to the client
            res.json({ "aiResponse" : aiResponse });
        }) 
        .catch(error => {
            console.error('Error:', error);
            //res.status(500).json({ error: 'An error occurred' });
            res.status(500).json({ 'item': 'please retry', 'quantity': 0});
        });
});

app.post('/api/upload', async (req, res) => {
    const base64Image = req.body.image;

    const accountName = process.env.BLOB_ACCOUNT_NAME;
    const accountKey = process.env.BLOB_ACCOUNT_KEY;
    const containerName = process.env.BLOB_CONTAINER_NAME;

    // Create the BlobServiceClient object which will be used to create a container client
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        sharedKeyCredential
    );

    // Get a reference to a container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Create a unique name for the blob
    const blobName = uuidv4() + '.png';

    // Convert base64 image to ArrayBuffer
    const imageBuffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ""), 'base64');

    // Get block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload data to the blob
    await blockBlobClient.upload(imageBuffer, imageBuffer.length);

    // Generate SAS token
    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + 10);

    const sasToken = generateBlobSASQueryParameters({
        containerName,
        blobName,
        permissions: 'r',
        expiresOn
    }, sharedKeyCredential).toString();

    // Return SAS URL
    const url = `${blockBlobClient.url}?${sasToken}`;
    //console.log(url);
    res.json({ url });
});



app.listen(3000, () => console.log('Server started on port 3000'));