import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { Stack } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';


function CheckOut({ setCheckOutImageUrl }) {
    const videoRef = useRef();
    const canvasRef = useRef();
    const [devices, setDevices] = useState([]);
    const [imageCaptured, setImageCaptured] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [rawResponse, setRawResponse] = useState(false);
    const [userPrompt, setUserPrompt] = useState('You are a security officer that check in visitor. You perform inventory check based on image. List down the items and quantity in the image. response in json. Sample response:[{"item": "item1", "quantity": 1}, {"item": "item2", "quantity": 2}]');
    // to be replaced by open ai response
    const [aiVisionResponse, setAIVisionResponse] = useState([]);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices()
            .then(deviceInfos => {
                const videoDevices = deviceInfos.filter(deviceInfo => deviceInfo.kind === 'videoinput');
                setDevices(videoDevices);
                setSelectedDevice(videoDevices[0]?.deviceId);
            });
    }, []);

    useEffect(() => {
        if (selectedDevice) {
            navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedDevice } })
                .then(stream => {
                    let video = videoRef.current;
                    video.srcObject = stream;
                    video.play();
                });
        }
    }, [selectedDevice]);

    async function uploadImage(base64Image) {
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: base64Image })
        });
        const data = await response.json();
        return data.url;
    }

    const handleCapture = () => {
        let canvas = canvasRef.current;
        let video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);        
        uploadImage(canvas.toDataURL('image/png'))
            .then(url => {
                setCheckOutImageUrl(url);
                return fetch('/api/scan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url: url, userPrompt: userPrompt })
                });
            })
            .then(response => response.json())
            .then(data => {
                if (rawResponse) {
                    setRawResponse(true);
                } else {
                    setAIVisionResponse(data.aiResponse);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        setImageCaptured(true);
    };

    const handleClear = () => {
        let canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        setImageCaptured(false);
        setRawResponse(false);
        setCheckOutImageUrl(null);
        setAIVisionResponse([]);
    };

    const handleInputChange = (event) => {
        setUserPrompt(event.target.value);
    };

    const handleToggle = (event) => {
        setRawResponse(event.target.checked);
    };

    return (
        <Box m={3}>
            <Paper elevation={3} square={false} sx={{ minHeight: '30vh' }}>
                <Grid container spacing={2}>
                    <Grid xs={6}>
                        <Stack spacing={2} p={3}>
                            <h3>Check Out</h3>
                            <TextField
                                id="check-in-prompt"
                                label="Prompt"
                                multiline
                                rows={2}
                                defaultValue={userPrompt}
                                fullWidth={true}
                                sx={{ fontSize: '10px' }}
                                onChange={handleInputChange}
                            />

                            <Stack spacing={3} direction="row">
                                <Select value={selectedDevice} sx={{ maxWidth: '60%' }} onChange={(event) => setSelectedDevice(event.target.value)}>
                                    {devices.map(device => (
                                        <MenuItem key={device.deviceId} value={device.deviceId}>{device.label}</MenuItem>
                                    ))}
                                </Select>
                                <Button variant="contained" onClick={handleCapture}>Capture</Button>
                                <Button variant="contained" color="error" onClick={handleClear}>Clear</Button>
                            </Stack>

                            <video ref={videoRef} style={{ display: imageCaptured ? 'none' : 'block', width: '100%' }}></video>
                            <canvas ref={canvasRef} style={{ display: imageCaptured ? 'block' : 'none', width: '100%' }}></canvas>

                        </Stack>
                    </Grid>
                    <Grid xs={6}>
                        <Stack spacing={2} p={3}>

                            <h3>Response</h3>
                            <FormGroup>
                                <FormControlLabel control={<Switch checked={rawResponse} onChange={handleToggle} />} label="Raw Response" labelPlacement='start' />
                            </FormGroup>
                            {rawResponse ? (<TextField
                                    id="check-in-response"
                                    label="AI Vision Response"
                                    multiline
                                    maxRows={15}
                                    defaultValue={JSON.stringify(aiVisionResponse)}
                                    fullWidth={true}
                                    sx={{ fontSize: '10px' }}
                                />) : (<>
                                    <TableContainer component={Paper} sx={{ width: '100%', height: '100%' }}>
                                        <Table sx={{ minWidth: 250 }} aria-label="simple table">
                                            <TableHead>
                                                <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'lightgrey' }}>Item Name</TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: 'lightgrey' }}>Quantity</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {aiVisionResponse.map((row) => (
                                                    <TableRow key={row.item}>
                                                        <TableCell component="th" scope="row">
                                                            {row.item}
                                                        </TableCell>
                                                        <TableCell align="right">{row.quantity}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>)
                                }
                        </Stack>
                    </Grid>
                </Grid>

            </Paper>
        </Box>

    );
}

export default CheckOut;
