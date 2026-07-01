import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { IconButton } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import EventIcon from '@mui/icons-material/Event';
import VideocamIcon from '@mui/icons-material/Videocam';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);

    const [meetings, setMeetings] = useState([]);

    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);

            } catch (e) {
                //Implement Snack Bar
            }
        }
        fetchHistory();
    })
    let formatDate = (dataString) => {
        const date = new Date(dataString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`
    }
    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100%',
                bgcolor: '#0f1115',
                py: 4,
                px: 2,
                boxSizing: 'border-box',
                overflowX: 'hidden'
            }}
        >
            <IconButton
                onClick={() => { routeTo("/home"); }}
                sx={{
                    color: '#e8e8e8',
                    mb: 2,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
            >
                <HomeIcon />
            </IconButton>

            <Box
                sx={{
                    width: '100%',
                    maxWidth: 480,
                    mx: 'auto',
                    boxSizing: 'border-box'
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        color: '#e8e8e8',
                        fontWeight: 600,
                        mb: 3,
                        textAlign: 'center',
                        letterSpacing: '-0.5px'
                    }}
                >
                    Meeting History
                </Typography>

                {
                    meetings.length !== 0 ?
                        <Stack spacing={2} sx={{ width: '100%' }}>
                            {meetings.map((e, idx) => (
                                <Card
                                    key={idx}
                                    variant="outlined"
                                    sx={{
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        bgcolor: '#1a1d24',
                                        borderColor: 'rgba(255,255,255,0.08)',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                                        '&:hover': {
                                            borderColor: 'rgba(255,255,255,0.2)',
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                >
                                    <CardContent sx={{ '&:last-child': { pb: 2 }, minWidth: 0 }}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, minWidth: 0 }}>
                                            <VideocamIcon sx={{ fontSize: 18, color: '#8b8f9a', flexShrink: 0 }} />
                                            <Typography
                                                sx={{
                                                    color: '#e8e8e8',
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    wordBreak: 'break-all',
                                                    overflowWrap: 'anywhere',
                                                    minWidth: 0
                                                }}
                                            >
                                                {e.meetingCode}
                                            </Typography>
                                        </Stack>

                                        <Chip
                                            icon={<EventIcon sx={{ fontSize: 14 }} />}
                                            label={formatDate(e.date)}
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(255,255,255,0.06)',
                                                color: '#8b8f9a',
                                                fontSize: 12,
                                                '& .MuiChip-icon': { color: '#8b8f9a' }
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                        :
                        <Box
                            sx={{
                                textAlign: 'center',
                                py: 6,
                                color: '#5a5e68'
                            }}
                        >
                            <VideocamIcon sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                            <Typography sx={{ fontSize: 14 }}>
                                No meetings yet
                            </Typography>
                        </Box>
                }
            </Box>
        </Box>
    )
}