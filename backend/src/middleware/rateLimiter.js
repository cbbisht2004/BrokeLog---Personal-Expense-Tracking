import ratelimiter from '../config/upstash.js';

//rate limiter middleware

const rateLimiter = async (req, res, next) => {
    try {
        //we could have user id or ip address as the key for rate limiting
        const {success} = await ratelimiter.limit("my-rate-limit");
        if (!success) {
            return res.status(429).json({
                error: "Too many requests, please try again later."
            });
        }
        next(); //proceed to the next middleware or route handler

    }
    catch (error) {
        console.log("❌ Error checking rate limit:", error);
        return res.status(500).json({
            error: "Internal server error"
        });
        }
    }

export default rateLimiter;

//we put this infront of our apis
