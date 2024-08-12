import express, { response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import User from './Usermodels/UserModes.js'; // Adjust the import path as needed
import cookieParser from 'cookie-parser'

dotenv.config();
const port = process.env.PORT || 3001;
const jwtSecret = 'sfkf97jj' 

const app = express();

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5173','https://frolicking-liger-91d98e.netlify.app'] ,// Adjust the frontend origin as needed
    credentials: true, // Allow credentials
}));

app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieParser());

// Login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid email' });
        }

        // Check if password matches (plain text comparison)
        if (user.password !== password) {
            return res.status(400).json({ success: false, error: 'Invalid password' });
        }

        // Create and sign a JWT token
        const payload = { userId: user._id, email: user.email,username: user.username };
        jwt.sign(payload, jwtSecret, {}, (err, token) => {
            if (err) {
                console.error('Token generation error:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            res.cookie('token', token, {
                httpOnly: true, // Prevent client-side access to the token
                secure: false, // Set to false for local development (HTTPS is not typically used)
                sameSite: 'lax', // 'lax' is usually sufficient for local development
                path: '/', // Cookie should be available across the entire site
                // maxAge: 3600000, // Cookie expiration (1 hour in milliseconds)
            });

            res.status(200).json({ success: true, user });
        });
        
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Signup route
app.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        // Create the user
        const newUser = new User({ username, email, password });

        await newUser.save();

        res.status(201).json({ success: true, message: 'Account created successfully', newUser });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/profile', (req, res) => {
    // console.log(req.cookies); // Logs the cookies to the console

    const { token } = req.cookies;
    // console.log(token);
    

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token if using JWT
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(403).json({ error: 'Invalid token' });
        }
        // console.log(user);
        

        // Successfully verified token
        res.json({ user });
    });
});


app.post('/addtowatchlist', async (req, res) => {
    try {
        const { moviedetail, useremail } = req.body;

        // Check if required fields are provided
        if (!moviedetail || !useremail) {
            return res.status(400).json({ success: false, error: 'Movie detail and user email are required' });
        }

        // Find the user by email
        const user = await User.findOne({ email: useremail });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check if the movie detail is already in the watchlistArray to avoid duplicates
        const isAlreadyInWatchlist = user.watchlistArray.some(item => item.id === moviedetail.id);
        if (isAlreadyInWatchlist) {
            return res.status(400).json({ success: false, error: 'Movie already in watchlist' });
        }

        // Add the movie detail to the watchlistArray
        user.watchlistArray.push(moviedetail);

        // Save the updated user document
        await user.save();

        res.status(200).json({ success: true, message: 'Movie added to watchlist' });
    } catch (error) {
        console.error('Error adding movie to watchlist:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


app.post('/getwatchlist', async (req, res) => {
    try {
        const { useremail } = req.body;
        console.log(useremail);

        // Find the user by email
        const user = await User.findOne({ email: useremail });
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Send the watchlistArray in the response
        res.status(200).json({ success: true, watchlistArray: user.watchlistArray });
    } catch (error) {
        console.error('Error getting watchlist:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


app.post('/logout', (req, res) => {
    res.cookie('token', " ").json('ok');
});


app.post('/removefromwatchlist', async (req, res) => {
    try {
        const { id, useremail } = req.body;

        if (!id || !useremail) {
            return res.status(400).json({ success: false, error: 'ID and email are required' });
        }

        // Find the user by email
        const user = await User.findOne({ email: useremail });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Log the current watchlistArray
        // console.log('Current watchlistArray:', user.watchlistArray);

        // Check the type of ID in the watchlistArray (for debugging)
        // console.log('Type of ID in watchlistArray:', typeof user.watchlistArray[0]?.id); 

        // Ensure the ID is in the correct format
        const movieId = String(id); // Convert to string if IDs are stored as strings

        // Filter out the movie with the matching ID
        user.watchlistArray = user.watchlistArray.filter(movie => String(movie.id) !== movieId);

        // Log the updated watchlistArray
        // console.log('Updated watchlistArray:', user.watchlistArray);

        // Save the updated user document
        await user.save();

        res.status(200).json({ success: true, message: 'Movie removed from watchlist' });
    } catch (error) {
        console.error('Error removing movie from watchlist:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});





// Connect to MongoDB
const uri = process.env.MONGOOSE_URI || 3001;

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`server is running on ${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });