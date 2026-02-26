const BASE_URL = 'http://localhost:3000/api';

async function measure(url, label) {
    const start = performance.now();
    try {
        const res = await fetch(url);
        const data = await res.json();
        const end = performance.now();
        const duration = (end - start).toFixed(2);
        console.log(`[${res.status}] ${label}: ${duration}ms`);
        return duration;
    } catch (e) {
        console.error(`${label} Failed:`, e.message);
        return null;
    }
}

async function runBenchmarks() {
    console.log('Starting API Performance Benchmarks...\n');

    // Warmup
    await measure(`${BASE_URL}/health`, 'Warmup Health');

    // Tests
    await measure(`${BASE_URL}/health`, 'GET /health');
    await measure(`${BASE_URL}/sports`, 'GET /sports');

    // Test Availability (requires a valid sport ID, will fetch first)
    const sportsRes = await fetch(`${BASE_URL}/sports`);
    const sportsData = await sportsRes.json();
    if (sportsData.success && sportsData.data.length > 0) {
        const sportId = sportsData.data[0]._id;
        const date = new Date().toISOString().split('T')[0];
        await measure(`${BASE_URL}/availability?date=${date}&sportId=${sportId}`, 'GET /availability');
    }

    // Test Admin Stats (might fail if not auth, but good to check if it returns 401 fast)
    await measure(`${BASE_URL}/admin/stats`, 'GET /admin/stats (Expect 401/403 mainly checking latency)');
}

runBenchmarks();
