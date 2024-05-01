import Grid from '@mui/material/Unstable_Grid2'; // Unstable_Grid2 is a temporary name for the new Grid component in MUI v5.2.0 
import CheckIn from './check-in';
import CheckOut from './check-out';
import CompareInOut from './compare';
import React, { useState } from 'react';

function DemoHome() {
    const [checkInImageUrl, setCheckInImageUrl] = useState(null);
    const [checkOutImageUrl, setCheckOutImageUrl] = useState(null);

    return (
        <>
            <Grid container spacing={2}>
                <Grid xs={12}>
                    <CheckIn setCheckInImageUrl={setCheckInImageUrl} />
                </Grid>
                {checkInImageUrl && (
                    <Grid xs={12}>
                        <CheckOut setCheckOutImageUrl={setCheckOutImageUrl} />
                    </Grid>
                )
                }

                {checkInImageUrl && checkOutImageUrl && (
                    <Grid xs={12}>
                        <CompareInOut checkInImageUrl={checkInImageUrl} checkOutImageUrl={checkOutImageUrl} />
                    </Grid>
                )}
            </Grid>
        </>

    );
}

export default DemoHome;
