import React from "react";
import { Button } from "react-bootstrap";


const Queue = ({ leaveQueue }) => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'var(--background-color)',
            color: 'var(--primary-color)',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'var(--primary-color)',
                border: '2px solid var(--accent-color)',
                borderRadius: '15px',
                padding: '40px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                textAlign: 'center'
            }}>
                <h2 className="text-light mb-4">Waiting to Join the Table...</h2>
                <p className="text-light mb-4">Please wait for the current hand to finish.</p>
                <Button
                    variant="danger"
                    onClick={leaveQueue}
                    style={{ padding: '10px 30px', fontSize: '18px', fontWeight: 'bold', borderRadius: '10px' }}
                >
                    Leave Queue
                </Button>
            </div>
        </div>
    );
};


export default Queue;
