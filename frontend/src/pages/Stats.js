import { useState, useEffect } from "react";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import NavigationBar from "../components/Navbar";
import "../styles/custom-theme.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Stats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const userResponse = await fetch(`${BACKEND_URL}/user`, { credentials: "include" });
                if (!userResponse.ok) throw new Error("Failed to fetch user");

                const userData = await userResponse.json();
                const userId = userData.id;

                const response = await fetch(`${BACKEND_URL}/stats/${userId}`, { credentials: "include" });
                if (!response.ok) throw new Error("Failed to fetch stats");

                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="bg-light min-vh-100">
                <NavigationBar />
                <Container className="d-flex justify-content-center align-items-center min-vh-100">
                    <div className="text-center">
                        <Spinner animation="border" role="status" className="text-primary">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                        <p className="text-primary mt-3">Loading stats...</p>
                    </div>
                </Container>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-light min-vh-100">
                <NavigationBar />
                <Container className="d-flex justify-content-center align-items-center min-vh-100">
                    <div className="content-box text-center">
                        <Alert variant="danger">Error: {error}</Alert>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100">
            <NavigationBar />
            <Container className="d-flex flex-column justify-content-center align-items-center mt-5">
                <h1 className="display-4 fw-bold text-primary mb-4">Player Stats</h1>
                <div className="content-box">
                    <Row className="mt-4">
                        <Col xs={6} className="text-start themed-subtitle">Games Played:</Col>
                        <Col xs={6} className="text-end">{stats.games_played}</Col>
                    </Row>
                    <Row>
                        <Col xs={6} className="text-start themed-subtitle">Games Won:</Col>
                        <Col xs={6} className="text-end">{stats.games_won}</Col>
                    </Row>
                    <Row>
                        <Col xs={6} className="text-start themed-subtitle">Total Chips Won:</Col>
                        <Col xs={6} className="text-end">{stats.total_chips_won}</Col>
                    </Row>
                    <Row>
                        <Col xs={6} className="text-start themed-subtitle">Hands Played:</Col>
                        <Col xs={6} className="text-end">{stats.hands_played}</Col>
                    </Row>
                    <Row>
                        <Col xs={6} className="text-start themed-subtitle">Hands Won:</Col>
                        <Col xs={6} className="text-end">{stats.hands_won}</Col>
                    </Row>
                    <Row>
                        <Col xs={6} className="text-start themed-subtitle">All-ins:</Col>
                        <Col xs={6} className="text-end">{stats.all_ins}</Col>
                    </Row>
                    <Row>
                        <Col xs={6} className="text-start themed-subtitle">Folds:</Col>
                        <Col xs={6} className="text-end">{stats.folds}</Col>
                    </Row>
                </div>
            </Container>
        </div>
    );
};

export default Stats;
