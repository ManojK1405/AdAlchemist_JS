import http from 'k6/http';
import { check, sleep } from 'k6';

// Define the load test configuration for Render (Lower load for safety)
export const options = {
    stages: [
        { duration: '30s', target: 5 },  // Warm up (Render free tier cold start)
        { duration: '1m', target: 20 }, // Sustained load
        { duration: '30s', target: 0 },  // Cool down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500'], // More relaxed for network latency
        http_req_failed: ['rate<0.02'],    // Allow for minor network noise
    },
};

// Target Render Deployment
const BASE_URL = 'https://adalchemist-2lmi.onrender.com/api/project';

export default function () {
    const requests = [
        ['GET', `${BASE_URL}/published`],
        ['GET', `${BASE_URL}/trending`],
    ];

    // Batch requests to simulate simultaneous loading of feed components
    const responses = http.batch(requests);

    responses.forEach((res) => {
        check(res, {
            'status is 200': (r) => r.status === 200,
            'response time < 1500ms': (r) => r.timings.duration < 1500,
        });
    });

    sleep(1); // Standard thinking time
}
