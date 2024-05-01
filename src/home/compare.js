import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import { Stack } from '@mui/material';
import Button from '@mui/material/Button';
import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

function CompareInOut({ checkInImageUrl, checkOutImageUrl }) {

    const [userPrompt, setUserPrompt] = useState('You are a security officer. You compare both images representing check in and check out. List down the items and quantity that are different in the check out image. Response in json. Sample response:[{"item": "item1", "quantity": 1}, {"item": "item2", "quantity": -2}]');
    const [aiVisionResponse, setAIVisionResponse] = useState([]);

    const handleCompare = () => {
        return fetch('/api/compare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inUrl: checkInImageUrl, outUrl: checkOutImageUrl, userPrompt: userPrompt })
        })
            .then(response => response.json())
            .then(data => {
                setAIVisionResponse(data.aiResponse);
            });
    }

    const handleInputChange = (event) => {
        setUserPrompt(event.target.value);
    };

    return (
        <Box m={3}>
            <Paper elevation={3} square={false} sx={{ minHeight: '32vh' }}>
                <Grid container spacing={2}>

                    <Grid xs={12} md={6}>
                        <Stack spacing={2} p={3}>
                            <h3>Compare</h3>
                            <TextField
                                id="compare-prompt"
                                label="Prompt"
                                multiline
                                rows={4}
                                defaultValue={userPrompt}
                                fullWidth={true}
                                sx={{ fontSize: '10px' }}
                                onChange={handleInputChange}
                            />
                            <Button variant="contained" onClick={handleCompare}>Compare</Button>
                            {aiVisionResponse.length > 0 && (
                                <TextField
                                    id="compare-output-prompt"
                                    label="AI Vision Response"
                                    multiline
                                    maxRows={5}
                                    defaultValue={JSON.stringify(aiVisionResponse)}
                                    fullWidth={true}
                                    sx={{ fontSize: '10px' }}
                                />
                            )}
                        </Stack>
                    </Grid>
                    <Grid xs={12} md={6}>
                        <Stack spacing={2} p={3}>
                            {aiVisionResponse.length > 0 && (
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
                                                    <TableCell align="right" sx={{ backgroundColor: row.quantity < 0 ? 'red' : 'green' }}>{row.quantity}</TableCell >
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}

export default CompareInOut;
