import React, { useState, useEffect } from 'react';
import './home.css'; // Ensure the icons are styled correctly
import { useAuth } from '../../context/authcontext';
import { getDatabase, ref, set, get } from 'firebase/database';
import { calculateScore } from './score_system';
import { update } from 'firebase/database';
import './predictionPage.css';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Font Awesome

const driverInitials = {
    'Max Verstappen': 'VER', 'Lando Norris': 'NOR', 'Charles Leclerc': 'LEC', 'Oscar Piastri': 'PIA',
    'Carlos Sainz': 'SAI', 'George Russell': 'RUS', 'Lewis Hamilton': 'HAM', 'Fernando Alonso': 'ALO',
    'Pierre Gasly': 'GAS', 'Nico Hulkenberg': 'HUL', 'Yuki Tsunoda': 'TSU', 'Lance Stroll': 'STR',
    'Esteban Ocon': 'OCO', 'Alexander Albon': 'ALB', 'Oliver Bearman': 'BEA', 'Liam Lawson': 'LAW',
    'Jack Doohan': 'DOO', 'Kimi Antonelli': 'ANT', 'Gabriel Bortoleto': 'BOR', 'Isack Hadjar': 'HAD'
};

const Home = () => {
    const { currentUser } = useAuth();
    const [activePage, setActivePage] = useState('Prediction');
    const [username, setUsername] = useState('');
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const db = getDatabase();

    // Check if username exists for the current user
    useEffect(() => {
        if (currentUser) {
            const userScoresRef = ref(db, `scores/${currentUser.uid}`);
            get(userScoresRef)
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        if (data.username) {
                            setUsername(data.username);
                        } else {
                            setShowUsernameModal(true);
                        }
                    } else {
                        setShowUsernameModal(true);
                    }
                })
                .catch((error) => console.error('Error checking username:', error));
        }
    }, [currentUser, db]);

    // Save the username to Firebase
    const handleUsernameSave = async (newUsername) => {
        if (currentUser) {
            const userScoresRef = ref(db, `scores/${currentUser.uid}`);
            try {
                await set(userScoresRef, {
                    username: newUsername,
                    score1: 0,
                    score2: 0,
                    multiplier: 1,
                    rno: 0,
                    cp: 0,
                });
                setUsername(newUsername);
                setShowUsernameModal(false);
                console.log('Username saved successfully!');
            } catch (error) {
                console.error('Error saving username:', error);
            }
        }
    };

    return (
        <div className="app-container">
            {showUsernameModal && (
                <div className="username-modal">
                    <h2>Set Your Username</h2>
                    <input
                        type="text"
                        placeholder="Here"
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                    />
                    <button
                        onClick={() => handleUsernameSave(username)}
                        disabled={!username.trim()}
                    >
                        Save
                    </button>
                </div>
            )}

            {!showUsernameModal && (
                <>
                    <div className="toggle-container">
                        <button
                            className={`toggle-button ${activePage === 'Prediction' ? 'active' : ''}`}
                            onClick={() => setActivePage('Prediction')}
                        >
                            Prediction
                        </button>
                        <button
                            className={`toggle-button ${activePage === 'Leaderboard' ? 'active' : ''}`}
                            onClick={() => setActivePage('Leaderboard')}
                        >
                            Leaderboard
                        </button>
                    </div>

                    {activePage === 'Prediction' ? <PredictionPage /> : <LeaderboardPage />}
                </>
            )}

        </div>
    );
};


const PredictionPage = () => {
    const { currentUser } = useAuth();
    const drivers = ['Max Verstappen', 'Lando Norris', 'Charles Leclerc', 'Oscar Piastri', 'Carlos Sainz', 'George Russell', 'Lewis Hamilton', 'Fernando Alonso', 'Pierre Gasly', 'Nico Hulkenberg', 'Yuki Tsunoda', 'Lance Stroll', 'Esteban Ocon', 'Alexander Albon', 'Oliver Bearman', 'Liam Lawson', 'Jack Doohan', 'Kimi Antonelli', 'Gabriel Bortoleto', 'Isack Hadjar'];
    const [selectedDrivers, setSelectedDrivers] = useState({ P1: '', P2: '', P3: '' });
    const [raceVenue, setRaceVenue] = useState(''); // Default to empty, fetched dynamically
    const [isLocked, setIsLocked] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(null); // Countdown state

    const db = getDatabase();
    const userId = currentUser?.uid;

    // Fetch the next GP and set the raceVenue from Firebase Realtime Database
    useEffect(() => {
        const fetchRaceVenue = async () => {
            const raceVenueRef = ref(db, 'Venue/GrandPrix');
            const snapshot = await get(raceVenueRef);

            if (snapshot.exists()) {
                setRaceVenue(snapshot.val());
                console.log("Next GP:", snapshot.val());
            } else {
                setRaceVenue('TBD');
            }
        };

        fetchRaceVenue().catch(error => {
            console.error('Error fetching race venue:', error);
            setRaceVenue('TBD');
        });
    }, [db]);

    // Fetch lock time and calculate countdown
    useEffect(() => {
        const fetchLockTimeAndSetCountdown = async () => {
            const lockTimeRef = ref(db, 'free');
            const snapshot = await get(lockTimeRef);

            if (snapshot.exists()) {
                const lockTime = new Date(snapshot.val());
                const updateCountdown = () => {
                    const now = new Date();
                    const diff = lockTime - now;

                    if (diff > 0) {
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                        setTimeRemaining({ days, hours, minutes, seconds });
                    } else {
                        setTimeRemaining(null); // Countdown over
                        setIsLocked(true); // Lock predictions when time runs out
                    }
                };

                updateCountdown();
                const intervalId = setInterval(updateCountdown, 1000);

                return () => clearInterval(intervalId); // Cleanup on unmount
            }
        };

        fetchLockTimeAndSetCountdown().catch(error => console.error('Error fetching lock time:', error));
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
            setSelectedDrivers((prev) => {
                const updated = { ...prev, [position]: driver };
                return updated;
            });
        }
    };
    
    const getAvailableDrivers = (currentPosition) => {
        const usedDrivers = Object.entries(selectedDrivers)
            .filter(([key, value]) => key !== currentPosition && value) // Exclude the current position
            .map(([, value]) => value); // Get selected drivers for other positions
        return drivers.filter((driver) => !usedDrivers.includes(driver)); // Exclude already selected drivers
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
            <div className="race-header">
    {/* Race Venue */}
    <h1 className="race-venue">{raceVenue || 'Loading...'}</h1>

    {/* Countdown Clock */}
    {timeRemaining ? (
        <div className="countdown-clock">
            <div className="time-segment">
                <span className="time-value">{timeRemaining.days}</span>
                <span className="time-label">Days</span>
            </div>
            <div className="time-segment">
                <span className="time-value">{timeRemaining.hours}</span>
                <span className="time-label">Hrs</span>
            </div>
            <div className="time-segment">
                <span className="time-value">{timeRemaining.minutes}</span>
                <span className="time-label">Mins</span>
            </div>
            <div className="time-segment">
                <span className="time-value">{timeRemaining.seconds}</span>
                <span className="time-label">Secs</span>
            </div>
        </div>
    ) : (
        <p className="clock-message">Predictions are locked!</p>
    )}
</div>


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
                                {getAvailableDrivers(position).map((driver, idx) => (
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
                        src={`/circuits/${raceVenue === 'TBD' ? 'placeholder-circuit' : raceVenue}.png`}
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
    const [raceVenue, setRaceVenue] = useState('');
    const db = getDatabase();

    useEffect(() => {
        const fetchRaceVenue = async () => {
            const raceVenueRef = ref(db, 'Venue/GrandPrix');
            const snapshot = await get(raceVenueRef);
            if (snapshot.exists()) {
                setRaceVenue(snapshot.val());
            } else {
                setRaceVenue('TBD');
            }
        };

        fetchRaceVenue().catch(error => console.error('Error fetching race venue:', error));
    }, [db]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const scoresRef = ref(db, 'scores');
                const scoresSnapshot = await get(scoresRef);
                if (!scoresSnapshot.exists()) return;

                const scoresData = scoresSnapshot.val();
                const leaderboardData = await Promise.all(
                    Object.keys(scoresData).map(async (userId) => {
                        const userPredictionsRef = ref(db, `predictions/${userId}/${raceVenue}`);
                        const userPredictionsSnapshot = await get(userPredictionsRef);
                        const predictions = userPredictionsSnapshot.exists() ? userPredictionsSnapshot.val() : null;

                        return {
                            username: scoresData[userId].username,
                            score1: scoresData[userId].score1,
                            score2: scoresData[userId].score2,
                            cp: scoresData[userId].cp,
                            rno: scoresData[userId].rno,
                            predictions,
                        };
                    })
                );

                leaderboardData.sort((a, b) => b.score1 - a.score1 || b.score2 - a.score2 || b.cp - a.cp);
                setLeaderboard(leaderboardData);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            }
        };

        if (raceVenue) {
            fetchLeaderboard();
        }
    }, [db, raceVenue]);

    return (
        <div className="leaderboard-page">
            <h1>Leaderboard</h1>
            <div className="leaderboard-container">
                {leaderboard.map((user, index) => (
                    <div key={index} className={`leaderboard-item ${index === 0 ? 'top-user' : ''}`}>
                        <span>{index + 1}. {user.username}</span>
                        {user.predictions ? (
                            <span className="prediction-info">
                               [{driverInitials[user.predictions.P1]}, {driverInitials[user.predictions.P2]}, {driverInitials[user.predictions.P3]}]
                            </span>
                        ) : (
                            <span className="no-prediction"></span>
                        )}
                        <span>{user.score1} pts</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


export default Home;
