import React, { useState, useEffect } from 'react';
import './home.css'; // Move App.css content here
import { useAuth } from '../../context/authcontext';
import { getDatabase, ref, set, get } from 'firebase/database';
import { calculateScore } from './score_system'; 
import { update } from 'firebase/database';
//import { processUserPredictions } from '../..utils/process_predictions';


const Home = () => {
    const { currentUser } = useAuth();
    const [activePage, setActivePage] = useState('Prediction');

    const handleToggle = (page) => {
        setActivePage(page);
    };

    return (
        <div className="app-container">
            {/* Toggle Buttons */}
            <div className="toggle-container">
                <button
                    className={`toggle-button ${activePage === 'Prediction' ? 'active' : ''}`}
                    onClick={() => handleToggle('Prediction')}
                >
                    Prediction
                </button>
                <button
                    className={`toggle-button ${activePage === 'Leaderboard' ? 'active' : ''}`}
                    onClick={() => handleToggle('Leaderboard')}
                >
                    Leaderboard
                </button>
            </div>

            {/* Conditional Rendering */}
            {activePage === 'Prediction' ? <PredictionPage /> : <LeaderboardPage />}
        </div>
    );
};

const PredictionPage = () => {
    const { currentUser } = useAuth();
    const drivers = ['Max Verstappen', 'Lando Norris', 'Charles Leclerc', 'Oscar Piastri', 'Carlos Sainz', 'George Russell', 'Lewis Hamilton', 'Fernando Alonso', 'Pierre Gasly', 'Nico Hulkenberg', 'Yuki Tsunoda', 'Lance Stroll', 'Esteban Ocon', 'Alexander Albon', 'Oliver Bearman', 'Liam Lawson', 'Jack Doohan', 'Kimi Antonelli', 'Gabriel Bortoleto'];
    const [selectedDrivers, setSelectedDrivers] = useState({ P1: '', P2: '', P3: '' });
    const [raceVenue, setRaceVenue] = useState(''); // Default to empty, fetched dynamically
    const [isLocked, setIsLocked] = useState(false);

    const db = getDatabase();
    const userId = currentUser?.uid;

    // Fetch the next GP and set the raceVenue
    useEffect(() => {
        fetch('https://api.openf1.org/v1/meetings?year=2025')
            .then(response => response.json())
            .then(data => {
                const currentDate = new Date();
                const upcomingMeetings = data.filter(meeting => new Date(meeting.date_start) > currentDate);
                const nextGP = upcomingMeetings.sort((a, b) => new Date(a.date_start) - new Date(b.date_start))[0];
                setRaceVenue(nextGP.meeting_name);
                console.log("Next GP:", nextGP.meeting_name);
            })
            .catch(error => setRaceVenue('Abu Dhabi'));
    }, []);

    useEffect(() => {
        const fetchLockTime = async () => {
            const lockTimeRef = ref(db, 'free');
            const snapshot = await get(lockTimeRef);
    
            if (snapshot.exists()) {
                const lockTime = new Date(snapshot.val()); // Parse the lock time from DB
                const currentTime = new Date();
                // Auto-lock predictions if the current time is past the lock time
                if (currentTime > lockTime) {
                    console.log("Predictions are locked automatically after the free time.");
                    setIsLocked(true);
                }
            }
        };
    
        fetchLockTime();
    }, [db]);
    
    // Load existing prediction
    useEffect(() => {
        if (userId && raceVenue) {
            const predictionRef = ref(db, `predictions/${userId}/${raceVenue}`);
            get(predictionRef)
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        setSelectedDrivers({
                            P1: data.P1,
                            P2: data.P2,
                            P3: data.P3,
                        });
                        setIsLocked(true); // If data exists, prediction is locked
                    }
                })
                .catch((error) => console.error('Error loading prediction:', error));
        }
    }, [userId, raceVenue]);
    

    const handleDriverSelect = (position, driver) => {
        if (!isLocked) {
            setSelectedDrivers((prev) => ({ ...prev, [position]: driver }));
        }
    };

    const handleLock = async () => {
        if (!isLocked && userId) {
            try {
                // Save prediction
                await set(ref(db, `predictions/${userId}/${raceVenue}`), selectedDrivers);

                // Save scores with userId as key
                const username = currentUser?.displayName || `User${userId.slice(-4)}`;
                const userScoresRef = ref(db, `scores/${userId}`);

                get(userScoresRef).then((snapshot) => {
                    if (!snapshot.exists()) {
                        set(userScoresRef, {
                            username,
                            score1: 0,
                            score2: 0,
                        });
                        console.log(`Scores initialized for user: ${username}`);
                    }
                }).catch((error) => console.error('Error initializing scores:', error));

                setIsLocked(true);
                console.log('Prediction locked and scores initialized!');
            } catch (error) {
                console.error('Error saving prediction:', error);
            }
        }
    };

    return (
        <div className="prediction-page">
            <h1 className="race-venue">{raceVenue || 'Loading...'}</h1>

            <div className="prediction-layout">
                {/* Prediction Cards */}
                <div className="prediction-container-horizontal">
                    {['P1', 'P2', 'P3'].map((position, index) => (
                        <div key={index} className="prediction-card">
                            <h3>{position}</h3>
                            <img
                                src={`/drivers/${selectedDrivers[position] || 'placeholder-driver'}.avif`}
                                alt="Driver"
                                className="driver-image"
                            />
                            {isLocked ? (
                                <div className="locked-driver-display">
                                    {selectedDrivers[position] || 'Not Selected'}
                                </div>
                            ) : (
                                <select
                                    className="driver-select"
                                    value={selectedDrivers[position]}
                                    onChange={(e) => handleDriverSelect(position, e.target.value)}
                                    disabled={isLocked}
                                >
                                    <option value="">Select Driver</option>
                                    {drivers.map((driver, idx) => (
                                        <option key={idx} value={driver}>
                                            {driver}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ))}
                </div>

                {/* Lock Button */}
                <div className="lock-button-container">
                    <button
                        className={`lock-button ${isLocked ? 'greyed-out' : ''}`}
                        onClick={handleLock}
                        disabled={isLocked}
                    >
                        {isLocked ? 'Locked' : 'Lock'}
                    </button>
                </div>

                {/* Circuit Layout */}
                <div className="circuit-layout">
                    <h2>Circuit Layout</h2>
                    <img
                        src={`/circuits/${raceVenue === 'TBD' ? 'placeholder-circuit' : raceVenue}.avif`}
                        alt="Loading..."
                        className="circuit-image"
                    />
                </div>
            </div>
        </div>
    );
};

const LeaderboardPage = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const db = getDatabase();

    useEffect(() => {
        const fetchLatestScores = async () => {
            try {
                const apiResultRef = ref(db, 'apiResult/result');
                const apiResultSnapshot = await get(apiResultRef);
                if (!apiResultSnapshot.exists()) return;
    
                const { GrandPrix, Top5Drivers } = apiResultSnapshot.val();
    
                const predictionsRef = ref(db, 'predictions');
                const predictionsSnapshot = await get(predictionsRef);
                if (!predictionsSnapshot.exists()) return;
    
                const predictions = predictionsSnapshot.val();
                const scoresUpdates = {};
    
                for (const userId in predictions) {
                    const userPredictions = predictions[userId];
                    
                    if (userPredictions[GrandPrix]) {
                        const { P1, P2, P3 } = userPredictions[GrandPrix];
    
                        // Calculate scores
                        const { score1, score2 } = calculateScore(P1, P2, P3, Top5Drivers);
    
                        // Fetch current user scores
                        const userScoresRef = ref(db, `scores/${userId}`);
                        const userSnapshot = await get(userScoresRef);
    
                        let currentScores = { score1: 0, score2: 0, username: `User_${userId.slice(-4)}` };
                        if (userSnapshot.exists()) {
                            currentScores = userSnapshot.val();
                        }
    
                        // Increment scores
                        scoresUpdates[userId] = {
                            score1: currentScores.score1 + score1,
                            score2: currentScores.score2 + score2,
                            username: currentScores.username
                        };
    
                        // Rename the prediction key to append '_done'
                        const predictionRef = ref(db, `predictions/${userId}`);
                        const updatedPredictionKey = `${GrandPrix}_done`;
    
                        await update(predictionRef, {
                            [updatedPredictionKey]: userPredictions[GrandPrix],
                        });
    
                        // Remove the old prediction key
                        await update(predictionRef, { [GrandPrix]: null });
                    }
                }
    
                // Push updated scores
                for (const userId in scoresUpdates) {
                    await update(ref(db, `scores/${userId}`), scoresUpdates[userId]);
                }
    
                // Fetch and display updated leaderboard
                const scoresRef = ref(db, 'scores');
                const updatedScoresSnapshot = await get(scoresRef);
    
                if (updatedScoresSnapshot.exists()) {
                    const scoresData = updatedScoresSnapshot.val();
                    const leaderboardData = Object.keys(scoresData).map(userId => ({
                        username: scoresData[userId].username,
                        score1: scoresData[userId].score1,
                        score2: scoresData[userId].score2,
                    }));
    
                    leaderboardData.sort((a, b) => {
                        if (b.score1 === a.score1) return b.score2 - a.score2;
                        return b.score1 - a.score1;
                    });
    
                    setLeaderboard(leaderboardData);
                }
            } catch (error) {
                console.error('Error updating leaderboard:', error);
            }
        };
    
        fetchLatestScores();
    }, [db]);
    

    return (
        <div className="leaderboard-page">
            <h1>Leaderboard</h1>
            <div className="leaderboard-container">
                {leaderboard.map((user, index) => (
                    <div
                        key={index}
                        className={`leaderboard-item ${index === 0 ? 'top-user' : ''}`}
                    >
                        <span>{index + 1}. {user.username}</span>
                        <span>{user.score1} pts</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


export default Home;
