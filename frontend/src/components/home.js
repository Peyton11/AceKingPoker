import { useEffect, useState } from "react";
import LoginButton from "./login";
import LogoutButton from "./logout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Home() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch(`${BACKEND_URL}/user`, { credentials: "include" })
            .then(res => {
                if (res.status === 401) {
                    setUser(null);
                } else {
                    return res.json();
                }
            })
            .then(data => setUser(data))
            .catch(() => setUser(null));
    }, []);

    return (
        <div>
            {user ? (
                <>
                    <h3>Welcome, {user.name}</h3>
                    <LogoutButton />
                </>
            ) : (
                <LoginButton />
            )}
        </div>
    );
}

export default Home;
